import { PrismaClient } from "@prisma/client";
import signData from "../graphql/utils/signData";

const prisma = new PrismaClient();

async function main() {
  /* ADMIN ############################## */

  const userAdmin = await prisma.user.create({
    data: {
      email: "admin@pokeapp.es",
      password: signData(`admin@pokeapp.es:admin`),
      newsletterOptIn: false,
      aclRole: "ADMIN",
      currency: "EUR",
    },
  });

  /* ############################## */

  /* USERS ############################## */

  for (let i = 1; i <= 5; i++) {
    await prisma.user.create({
      data: {
        email: `usuario${i}@pokeapp.es`,
        password: signData(`usuario${i}@pokeapp.es:admin`),
        newsletterOptIn: false,
        aclRole: "USER",
        name: `Usuario${i}`,
        lastname: `Apellido${i}`,
        birthday: new Date(1990, i, i),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        status: "ACTIVE",
        currency: "EUR",
      },
    });
  }

  const user1 = await prisma.user.findUnique({
    where: { email: "usuario1@pokeapp.es" },
  });

  /* ############################## */

  /* BUDGETS ############################## */

  const budgets = [];

  for (let i = 1; i <= 6; i++) {
    const budget = await prisma.budget.create({
      data: {
        name: `Presupuesto ${i}`,
        amount: 500 + i * 100,
        category: i % 2 === 0 ? "FOOD_AND_GROCERIES" : "ENTERTAINMENT",
        endDate: new Date(new Date().setMonth(new Date().getMonth() + i)),
        userId: user1.id,
      },
    });
    budgets.push(budget);

    // Add 10 transactions to each budget
    for (let j = 1; j <= 10; j++) {
      await prisma.transaction.create({
        data: {
          name: `Transacción ${j} del Presupuesto ${i}`,
          date: new Date(),
          amount: 20 + j * 5,
          type: "EXPENSE",
          category: i % 2 === 0 ? "FOOD_AND_GROCERIES" : "ENTERTAINMENT",
          userId: user1.id,
          budgetId: budget.id,
        },
      });
    }
  }

  /* ############################## */

  /* DEBTS ############################## */

  const debts = [];

  for (let i = 1; i <= 2; i++) {
    const debt = await prisma.debt.create({
      data: {
        name: `Deuda ${i}`,
        totalAmount: 1000 * i,
        interestRate: 4 + i,
        interestType: i % 2 === 0 ? "TIN" : "TAE",
        paymentYears: 5 + i,
        startDate: new Date(),
        userId: user1.id,
      },
    });
    debts.push(debt);

    // Add 4 transactions to each debt
    for (let j = 1; j <= 4; j++) {
      await prisma.transaction.create({
        data: {
          name: `Pago ${j} de la Deuda ${i}`,
          date: new Date(),
          amount: 50 + j * 10,
          type: "DEBT",
          category: "DEBT_PAYMENTS",
          userId: user1.id,
          debtId: debt.id,
        },
      });
    }
  }

  /* ############################## */

  /* INCOME TRANSACTIONS ############################## */

  for (let i = 1; i <= 5; i++) {
    await prisma.transaction.create({
      data: {
        name: `Ingreso ${i}`,
        date: new Date(),
        amount: 1000 + i * 500,
        type: "INCOME",
        incomeType: i % 2 === 0 ? "SALARY" : "FREELANCE",
        userId: user1.id,
      },
    });
  }

  /* ############################## */

  /* EXTRA TRANSACTIONS ############################## */

  for (let i = 1; i <= 10; i++) {
    await prisma.transaction.create({
      data: {
        name: `Transacción Extra ${i}`,
        date: new Date(),
        amount: 50 + i * 20,
        type: "EXPENSE",
        category: "MISCELLANEOUS",
        userId: user1.id,
      },
    });
  }

  /* ############################## */
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
