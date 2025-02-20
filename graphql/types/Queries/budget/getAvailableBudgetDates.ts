import { queryField, nonNull, stringArg, list } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getAvailableBudgetDates", {
  type: list("AvailableBudgetDates"),
  args: {
    userId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  resolve: async (_, { userId }, ctx) => {
    const budgets = await ctx.prisma.budget.findMany({
      where: { userId },
      include: { transactions: { select: { date: true } } },
    });

    const dateMap = new Map<number, Set<number>>(); // year -> set of months

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (const budget of budgets) {
      if (budget.isRecurring && budget.recurringStartDate) {
        const startYear = budget.recurringStartDate.getFullYear();
        const startMonth = budget.recurringStartDate.getMonth() + 1;

        // Añadir todos los meses desde el inicio hasta el actual
        for (let year = startYear; year <= currentYear; year++) {
          for (
            let month = year === startYear ? startMonth : 1;
            year < currentYear ? month <= 12 : month <= currentMonth;
            month++
          ) {
            if (!dateMap.has(year)) {
              dateMap.set(year, new Set());
            }
            dateMap.get(year)!.add(month);
          }
        }
      } else {
        // No recurrentes: solo en el mes y año en que fueron creados
        const createdYear = budget.createdAt.getFullYear();
        const createdMonth = budget.createdAt.getMonth() + 1;

        if (!dateMap.has(createdYear)) {
          dateMap.set(createdYear, new Set());
        }
        dateMap.get(createdYear)!.add(createdMonth);
      }

      // Incluir meses con transacciones futuras
      for (const transaction of budget.transactions) {
        const txYear = transaction.date.getFullYear();
        const txMonth = transaction.date.getMonth() + 1;

        if (!dateMap.has(txYear)) {
          dateMap.set(txYear, new Set());
        }
        dateMap.get(txYear)!.add(txMonth);
      }
    }

    // Convertir el Map en el formato esperado
    return Array.from(dateMap.entries()).map(([year, monthsSet]) => ({
      year,
      months: Array.from(monthsSet).sort((a, b) => a - b),
    }));
  },
});
