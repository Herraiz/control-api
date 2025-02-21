import { list, nonNull, queryField, stringArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getBudgetExpensesControl", {
  type: list("BudgetExpensesControl"),
  args: {
    userId: nonNull(stringArg()),
    budgetId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,

  resolve: async (_, { userId, budgetId }, ctx) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const budget = await ctx.prisma.budget.findUnique({
      where: {
        id: budgetId,
      },
    });

    if (!budget) {
      throw new ApolloError("Budget not found", "BUDGET_NOT_FOUND");
    }

    const now = new Date();
    const budgetExpensesControlData = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const expenses = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          budgetId,
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      budgetExpensesControlData.push({
        month: monthStart.getMonth() + 1,
        amount: budget.amount,
        expenses: expenses._sum.amount || 0,
      });
    }

    return budgetExpensesControlData.reverse();
  },
});
