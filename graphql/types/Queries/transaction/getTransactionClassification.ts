import { nonNull, queryField, stringArg } from "nexus";
import OpenAI from "openai";
import { ApolloError } from "apollo-server-micro";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactionClassification", {
  type: "TransactionClassification",
  args: {
    transactionText: nonNull(stringArg()),
    userId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { transactionText, userId }, ctx) => {
    // FIXME: Hay que filtrar lo que se le vía de budgets, calcular los de este mes con lo de recurrentes y demás

    // Obtener usuario y sus presupuestos/deudas
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        budgets: { select: { name: true, id: true } },
        debts: { select: { name: true, id: true } },
      },
    });

    if (!user) {
      throw new ApolloError("User not found", "USER_NOT_FOUND");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Definimos la estructura del mensaje a OpenAI
    const today = new Date().toISOString(); // Captura la fecha actual en formato ISO 8601

    const prompt = `
    Eres un asistente especializado en la clasificación de transacciones financieras. Antes de analizar la transacción proporcionada, revisa detenidamente la información del usuario para interpretar correctamente el contexto.
    
    📌 **Fecha actual:**  
    "${today}"  
    Usa esta fecha como referencia para calcular fechas relativas en la transacción.
    
    📌 **Información del usuario:**  
 
    ${JSON.stringify(user)}

    
    📌 **Texto de la transacción a analizar:**  
    "${transactionText}"
    
    ---
    
    🎯 **Reglas para clasificar la transacción:**
    
    1️⃣ **Nombre de la transacción ("name")**  
       - Debe ser un resumen corto de la transacción.
       - Extraído del texto original sin cambios innecesarios.
    
    2️⃣ **Descripción ("description")**  
       - Si la transacción requiere más detalles que no caben en "name", usa "description".
       - Ejemplo:  
         - name: "Cena en restaurante"  
         - description: "Cena con amigos en La Tagliatella el viernes por la noche."  
       - Si no hay detalles adicionales, omitir "description".
    
    3️⃣ **Monto ("amount")**  
       - Extrae el monto si está presente en la transacción.  
       - Si se menciona más de un monto, usa el que tenga más sentido en el contexto.  
       - Si no se menciona, devuelve "null".  
    
    4️⃣ **Tipo de transacción ("type")**  
       - Puede ser uno de los siguientes valores: **"EXPENSE"**, **"INCOME"**, **"DEBT"**.  
       - **Si no se puede clasificar con certeza, usa "EXPENSE" por defecto**.  
    
    5️⃣ **Categoría ("category")**  
       - Si la transacción es un "EXPENSE", asigna una categoría de esta lista:  
         ["FOOD_AND_GROCERIES", "RESTAURANTS_AND_DINING", "TRANSPORTATION",
         "HOUSING_AND_RENT", "UTILITIES", "HEALTHCARE", "INSURANCE",
         "PERSONAL_CARE", "CLOTHING", "ENTERTAINMENT", "TRAVEL",
         "EDUCATION", "GIFTS_AND_DONATIONS", "SAVINGS_AND_INVESTMENTS",
         "TAXES", "DEBT_PAYMENTS", "MISCELLANEOUS"]  
       - Si no se puede determinar la categoría, usa **"MISCELLANEOUS"**.  
       - Si la transacción es un "DEBT", la categoría siempre será **"DEBT_PAYMENTS"**.  
       - Si la transacción es un "INCOME", la categoría debe ser omitida en la respuesta.  
    
    6️⃣ **Tipo de ingreso ("incomeType")**  
       - Solo aplica si la transacción es un "INCOME".  
       - Puede ser uno de los siguientes valores:  
         ["SALARY", "PENSION", "INVESTMENT", "RENTAL", "BUSINESS",
         "FREELANCE", "GOVERNMENT_BENEFITS", "GIFTS", "OTHER"]  
       - **Si no se puede determinar el tipo de ingreso, usa "OTHER" por defecto**.  
       - Si no aplica, **no incluyas "incomeType" en la respuesta**.  
    
    7️⃣ **Asignación a presupuestos ("budgetId") o deudas ("debtId")**  
       - Si la transacción es un "DEBT", revisa los nombres de las deudas del usuario y asigna la **"debtId"** correspondiente.  
       - Si la transacción es un "EXPENSE" y parece encajar en algún presupuesto del usuario, asigna la **"budgetId"**.  
       - **Si hay varias opciones posibles, elige la que tenga un nombre más similar al de la transacción.**  
       - **No adivines un budgetId o debtId si no hay coincidencia clara en los nombres.**  
       - **Si no se encuentra un presupuesto o deuda coincidente, NO incluyas "budgetId" ni "debtId" en la respuesta**.  
    
    8️⃣ **Fecha de la transacción ("date")**  
       - Usa la fecha actual como referencia: **"${today}"**.  
       - Si el "transactionText" menciona una fecha relativa (ejemplo: "ayer", "el sábado pasado", "hace tres días"), calcula la fecha exacta y devuélvela en formato **ISO 8601** ("YYYY-MM-DDTHH:mm:ssZ").  
       - **No incluyas la clave "date" en la respuesta si la fecha es el día de hoy**.  
       - **Ejemplos de fechas interpretadas correctamente:**  
         - "Ayer fui al cine" → "date": "2025-03-05T12:00:00Z"  
         - "El sábado pasado compré un libro" → "date": "2025-03-01T12:00:00Z"  
         - "Recibí mi sueldo hoy" → 🔴 **No incluir "date" en el JSON**  
    
    ---
    
    📌 **Formato de respuesta esperado (sin explicaciones adicionales):**  
    
    Ejemplo de gasto asignado a un presupuesto:
   
    {
      "name": "Compra en supermercado",
      "description": "Compra de alimentos en Carrefour",
      "amount": 35.50,
      "type": "EXPENSE",
      "category": "FOOD_AND_GROCERIES",
      "budgetId": "abc123"
    }
  
    
    Ejemplo de pago de deuda:

    {
      "name": "Pago de préstamo bancario",
      "description": "Cuota mensual del préstamo hipotecario",
      "amount": 250.00,
      "type": "DEBT",
      "category": "DEBT_PAYMENTS",
      "debtId": "xyz456",
      "date": "2025-03-05T12:00:00Z"
    }

    
    Ejemplo de ingreso sin categoría pero con incomeType:
  
    {
      "name": "Cobro por proyecto freelance",
      "description": "Pago recibido por trabajo de diseño web",
      "amount": 1500,
      "type": "INCOME",
      "incomeType": "FREELANCE"
    }

    
    🚀 **Recuerda seguir estrictamente el formato JSON y no incluir explicaciones en la respuesta.**
    `;

    // Llamada a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content);

    // // DEBUG & TESTING
    // console.log("\n");
    // console.log("usuario", user);
    // console.log("#####################################################");

    // console.log("\n");
    // console.log("transactionText", transactionText);
    // console.log("#####################################################");

    // console.log("\n");
    // console.log("respuesta raw", response.choices[0].message.content);
    // console.log("#####################################################");

    // console.log("\n");
    // console.log("parsedResponse", parsedResponse);
    // console.log("#####################################################");

    // Retornar la transacción clasificada
    return {
      name: parsedResponse.name,
      description: parsedResponse.description || null,
      date: parsedResponse.date ? new Date(parsedResponse.date) : new Date(), // Usa la fecha solo si la respuesta la incluye
      amount: parsedResponse.amount ?? 0, // Si no hay monto, se asume 0
      type: parsedResponse.type,
      category:
        parsedResponse.type === "EXPENSE"
          ? parsedResponse.category || "MISCELLANEOUS"
          : null,
      incomeType:
        parsedResponse.type === "INCOME"
          ? parsedResponse.incomeType || "OTHER"
          : null,
      budgetId: parsedResponse.budgetId || null,
      debtId: parsedResponse.debtId || null,
    };
  },
});
