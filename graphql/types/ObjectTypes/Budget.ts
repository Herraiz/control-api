import { objectType } from "nexus";

export default objectType({
  name: "Budget",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.float("amount");
    t.nonNull.field("category", {
      type: "Category",
    });

    t.nonNull.field("user", {
      type: "User",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.user.findFirst({
          where: {
            budgets: {
              some: {
                id: parent.id,
              },
            },
          },
        });
      },
    });

    t.nullable.list.field("transactions", {
      type: "Transaction",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.transaction.findMany({
          where: {
            budgetId: parent.id,
          },
        });
      },
    });

    t.nonNull.float("balance", {
      resolve: async (parent, _args, ctx) => {
        const transactions = await ctx.prisma.transaction.findMany({
          where: {
            budgetId: parent.id,
          },
        });
        return transactions.reduce((acc, transaction) => {
          return transaction.type === "INCOME"
            ? acc + transaction.amount
            : acc - transaction.amount;
        }, parent.amount);
      },
    });

    t.nonNull.dateTime("endDate");

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
