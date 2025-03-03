import { list, nonNull, nullable, queryField, stringArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getCashFlow", {
  type: list("CashFlow"),
  args: {
    userId: nonNull(stringArg()),
    year: nullable(stringArg()),
    month: nullable(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,

  resolve: async (_, { userId, year, month }, ctx) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const now = new Date();
    const cashFlowData = [];

    if (year && month) {
      const monthStart = new Date(parseInt(year), parseInt(month), 1);
      const monthEnd = new Date(parseInt(year), parseInt(month) + 1, 1);

      const expenses = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const incomes = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          type: "INCOME",
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      return [
        {
          month: parseInt(month),
          incomes: incomes._sum.amount || 0,
          expenses: expenses._sum.amount || 0,
        },
      ];
    }

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const expenses = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const incomes = await ctx.prisma.transaction.aggregate({
        where: {
          userId,
          type: "INCOME",
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      cashFlowData.push({
        month: monthStart.getMonth() + 1,
        incomes: incomes._sum.amount || 0,
        expenses: expenses._sum.amount || 0,
      });
    }

    return cashFlowData.reverse();
  },
});
