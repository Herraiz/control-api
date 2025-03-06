import { list, nonNull, queryField, stringArg, intArg, nullable } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getAlerts", {
  type: list("Alert"),
  args: {
    userId: nonNull(stringArg()),
    month: nullable(intArg()),
    year: nullable(intArg()),
  },
  authorize: authorizeFieldCurrentUser,

  resolve: async (
    _,
    {
      userId,
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
    },
    ctx,
  ) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const startDate = new Date(year, month - 1, 1);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = new Date(nextYear, nextMonth - 1, 1);

    // Alert types: BUDGET_EXCEEDED, BUDGET_80

    const alerts = [];

    // BUDGET_EXCEEDED & BUDGET_80
    const budgets = await ctx.prisma.budget.findMany({
      where: {
        userId,
      },
    });

    for (const budget of budgets) {
      const expenses = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          budgetId: budget.id,
          type: "EXPENSE",
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      if (expenses._sum.amount > budget.amount) {
        alerts.push({
          user: { id: userId },
          userId,
          type: "BUDGET_EXCEEDED",
          budget,
          budgetId: budget.id,
          expenses: expenses._sum.amount,
        });
      } else if (expenses._sum.amount > budget.amount * 0.8) {
        alerts.push({
          user: { id: userId },
          userId,
          type: "BUDGET_80",
          budget,
          budgetId: budget.id,
          expenses: expenses._sum.amount,
        });
      }
    }
    return alerts;
  },
});
