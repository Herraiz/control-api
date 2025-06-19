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
    // Obtener filtros de fecha para el mes actual (misma lógica que getBudgets)
    const now = new Date();
    const monthFilter = now.getMonth() + 1;
    const yearFilter = now.getFullYear();

    // Obtener usuario y sus presupuestos/deudas
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        budgets: {
          where: {
            OR: [
              {
                isRecurring: true,
                recurringStartDate: {
                  lte: new Date(yearFilter, monthFilter, 0),
                },
              },
              {
                isRecurring: false,
                createdAt: {
                  gte: new Date(yearFilter, monthFilter - 1, 1),
                  lt: new Date(yearFilter, monthFilter, 1),
                },
              },
            ],
          },
          select: { name: true, id: true },
          orderBy: { updatedAt: "desc" },
        },
        debts: { select: { name: true, id: true } },
      },
    });

    if (!user) {
      throw new ApolloError("User not found", "USER_NOT_FOUND");
    }

    console.log("user", user);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Definimos la estructura del mensaje a OpenAI
    const today = new Date().toLocaleDateString("es-ES");

    const prompt = `
Eres un asistente especializado en la clasificación de transacciones financieras. Antes de analizar la transacción proporcionada, revisa detenidamente la información del usuario para interpretar correctamente el contexto.
    
 **Fecha actual:**  
"${today}"  
Usa esta fecha como referencia para calcular fechas relativas en la transacción.
    
 **Información del usuario:**  
${JSON.stringify(user)}

 **Texto de la transacción a analizar:**  
"${transactionText}"

---

 **Reglas para clasificar la transacción:**

1️ **Nombre de la transacción ("name")**  
   - Debe ser un resumen corto y preciso de la transacción.  
   - Extraído del texto original sin cambios innecesarios.  

2️ **Descripción ("description")**  
   - Debe contener toda la información relevante que el usuario proporcionó y que no está en el "name".  
   - Ejemplo:  
     - **name:** "Compra en supermercado"  
     - **description:** "Compra de alimentos y artículos de limpieza en Carrefour".  
   - Si el "name" ya tiene toda la información, omitir "description".  

3️ **Monto ("amount")**  
   - Extrae el monto si está presente en la transacción.  
   - Si hay más de un monto, usa el que tenga más sentido en el contexto.  
   - Si no se menciona un monto, devuelve "null".  

4️ **Tipo de transacción ("type")**  
   - Puede ser **"EXPENSE"**, **"INCOME"** o **"DEBT"**.  
   - **Si no se puede clasificar con certeza, usa "EXPENSE" por defecto.**  

5️ **Categoría ("category")**  
   - Si la transacción es un "EXPENSE", asigna una categoría de la lista:  
     ["FOOD_AND_GROCERIES", "RESTAURANTS_AND_DINING", "TRANSPORTATION",
     "HOUSING_AND_RENT", "UTILITIES", "HEALTHCARE", "INSURANCE",
     "PERSONAL_CARE", "CLOTHING", "ENTERTAINMENT", "TRAVEL",
     "EDUCATION", "GIFTS_AND_DONATIONS", "SAVINGS_AND_INVESTMENTS",
     "TAXES", "DEBT_PAYMENTS", "MISCELLANEOUS"].  
   - **Aplica relaciones conceptuales:**  
     - Si el nombre de la transacción menciona un producto o servicio, verifica si pertenece a una categoría existente.  
     - Ejemplo:  
       - **Texto:** "Pago de suscripción Spotify" → **Categoría:** '"ENTERTAINMENT"'.  
       - **Texto:** "Compra de champú y crema" → **Categoría:** '"PERSONAL_CARE"'.  
   - Si no se puede determinar la categoría con certeza, usa **"MISCELLANEOUS"**.  
   - Si la transacción es un "DEBT", la categoría siempre será **"DEBT_PAYMENTS"**.  
   - Si la transacción es un "INCOME", la categoría debe ser omitida en la respuesta.  

6️ **Tipo de ingreso ("incomeType")**  
   - Solo aplica si la transacción es un "INCOME", y además si es de ese tipo debes devolver siempre un incomeType
   - Puede ser:  
     ["SALARY", "PENSION", "INVESTMENT", "RENTAL", "BUSINESS",
     "FREELANCE", "GOVERNMENT_BENEFITS", "GIFTS", "OTHER"].  
   - **Si no se puede determinar, usa "OTHER" por defecto.**  
   - Si no aplica, **no incluyas "incomeType" en la respuesta**.  

  7️ **Asignación a presupuestos ("budgetId") o deudas ("debtId")**  
       - Si la transacción es un "DEBT", revisa los nombres de las deudas del usuario y asigna la **"debtId"** correspondiente.  
       - Si la transacción es un "EXPENSE" revisa los nombres de los presupuestos del usuario y asigna asigna la **"budgetId"** correspondiente.
       - Tanto con DEBT como con EXPENSE, se abierto en la interpretación de las coincidencias, intenta buscar relaciones entre lo que se menciona en la transacción y los nombres de presupuestos y deudas del usuario. 
       - **Si hay varias opciones posibles, elige la que tenga un nombre más similar al de la transacción.**  
       - **Si no se encuentra un presupuesto o deuda coincidente, NO incluyas "budgetId" ni "debtId" en la respuesta**. 


8️ **Fecha de la transacción ("date")**  
   - Si el "transactionText" menciona una fecha relativa (ejemplo: "ayer", "el sábado pasado", "hace tres días"), calcula la fecha exacta y devuélvela en formato **ISO 8601** ("YYYY-MM-DDTHH:mm:ssZ").  
   - **Ejemplos:**  
     - **Texto:** "Ayer fui al cine" → '"date": le quitas un día al today.  
     - **Texto:** "El sábado pasado compré un libro" → '"date": calculas el número de días que pasaron desde el último día que fue sábado y se los restas al today.  
     - **Texto:** "Recibí mi sueldo hoy" → '"date": today.
   - Si no se menciona una fecha, usa la fecha actual.

---

 **Formato de respuesta esperado (sin explicaciones adicionales):**  

Ejemplo de gasto asignado a un presupuesto:  

{
  "name": "Compra en supermercado",
  "description": "Compra de alimentos y artículos de limpieza en Carrefour",
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

 Recuerda seguir estrictamente el formato JSON y no incluir explicaciones en la respuesta. `;

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

    console.log("\n");
    console.log("parsedResponse", parsedResponse);
    console.log("#####################################################");

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
