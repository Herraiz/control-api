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

    t.nonNull.boolean("isRecurring");
    t.nullable.dateTime("recurringStartDate");

    t.nullable.int("month", {
      resolve: async (parent, _args, ctx) => {
        if (parent.isRecurring) {
          return new Date(parent.recurringStartDate).getMonth() + 1;
        } else {
          return null;
        }
      },
    });

    t.nullable.int("year", {
      resolve: async (parent, _args, ctx) => {
        if (parent.isRecurring) {
          return new Date(parent.recurringStartDate).getFullYear();
        } else {
          return null;
        }
      },
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
      args: {
        month: "Int",
        year: "Int",
      },
      resolve: async (parent, { month, year }, ctx) => {
        const now = new Date();
        const monthFilter =
          month ?? (parent.isRecurring ? now.getMonth() + 1 : undefined);
        const yearFilter =
          year ?? (parent.isRecurring ? now.getFullYear() : undefined);

        return ctx.prisma.transaction.findMany({
          where: {
            budgetId: parent.id,
            ...(parent.isRecurring &&
              monthFilter &&
              yearFilter && {
                date: {
                  gte: new Date(yearFilter, monthFilter - 1, 1),
                  lt: new Date(yearFilter, monthFilter, 1),
                },
              }),
          },
        });
      },
    });

    t.nullable.float("balance", {
      args: {
        month: "Int",
        year: "Int",
      },
      resolve: async (parent, { month, year }, ctx) => {
        const now = new Date();
        const monthFilter =
          month ?? (parent.isRecurring ? now.getMonth() + 1 : undefined);
        const yearFilter =
          year ?? (parent.isRecurring ? now.getFullYear() : undefined);

        const transactions = await ctx.prisma.transaction.findMany({
          where: {
            budgetId: parent.id,
            ...(parent.isRecurring &&
              monthFilter &&
              yearFilter && {
                date: {
                  gte: new Date(yearFilter, monthFilter - 1, 1),
                  lt: new Date(yearFilter, monthFilter, 1),
                },
              }),
          },
        });

        return transactions.reduce((acc, transaction) => {
          return transaction.type === "INCOME"
            ? acc + transaction.amount
            : acc - transaction.amount;
        }, parent.amount);
      },
    });

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
