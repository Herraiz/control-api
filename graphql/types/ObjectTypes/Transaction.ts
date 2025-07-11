import { objectType } from "nexus";

export default objectType({
  name: "Transaction",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.dateTime("date");
    t.nonNull.int("month", {
      resolve: async (parent, _args, ctx) => {
        return new Date(parent.date).getMonth() + 1;
      },
    });
    t.nonNull.int("year", {
      resolve: async (parent, _args, ctx) => {
        return new Date(parent.date).getFullYear();
      },
    });
    t.nullable.string("description");
    t.nonNull.float("amount");
    t.nonNull.field("type", {
      type: "TransactionType",
    });
    t.nullable.field("category", {
      type: "Category",
    });
    t.nullable.field("incomeType", {
      type: "IncomeType",
    });

    t.nonNull.field("user", {
      type: "User",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.user.findFirst({
          where: {
            transactions: {
              some: {
                id: parent.id,
              },
            },
          },
        });
      },
    });

    t.nullable.field("budget", {
      type: "Budget",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.budget.findFirst({
          where: {
            transactions: {
              some: {
                id: parent.id,
              },
            },
          },
        });
      },
    });

    t.nullable.field("debt", {
      type: "Debt",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.debt.findFirst({
          where: {
            transactions: {
              some: {
                id: parent.id,
              },
            },
          },
        });
      },
    });

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
