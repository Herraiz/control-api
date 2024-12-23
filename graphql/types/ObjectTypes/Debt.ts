import { objectType } from "nexus";

export default objectType({
  name: "Debt",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.float("totalAmount");
    t.nonNull.float("interestRate");
    t.nonNull.field("interestType", {
      type: "InterestType",
    });
    t.nonNull.int("paymentYears");
    t.nonNull.dateTime("startDate");

    t.nonNull.field("user", {
      type: "User",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.user.findFirst({
          where: {
            debts: {
              some: {
                id: parent.id,
              },
            },
          },
        });
      },
    });

    t.list.field("transactions", {
      type: "Transaction",
      resolve: async (parent, _args, ctx) => {
        return ctx.prisma.transaction.findMany({
          where: {
            debtId: parent.id,
          },
        });
      },
    });

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
