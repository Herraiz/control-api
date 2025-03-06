import { list, nonNull, queryField, stringArg, intArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getExpensesByCategory", {
  type: list("ExpensesByCategory"),
  args: {
    userId: nonNull(stringArg()),
    month: nonNull(intArg()),
    year: nonNull(intArg()),
  },
  authorize: authorizeFieldCurrentUser,

  resolve: async (_, { userId, month, year }, ctx) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const startDate = new Date(year, month - 1, 1);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = new Date(nextYear, nextMonth - 1, 1);

    // TODO: Faltaría hacer el or en el type para que también se consideren las deudas, pero como éstas no pueden tener categoría en el front, no se consideran por ahora
    const expenses = await ctx.prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type: "EXPENSE",
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });

    return expenses.map((expense) => ({
      category: expense.category,
      total: expense._sum.amount || 0,
    }));
  },
});
