import { InterestType } from "@prisma/client";
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

    // calculated remainingAmount -> calculate interest amount and sum with totalAmount
    t.float("remainingAmount", {
      resolve: async (parent, _args, ctx) => {
        let remainingAmount = parent.totalAmount;
        const interestRate = parent.interestRate / 100;

        if (parent.interestType === InterestType.TIN) {
          // Calculate simple interest
          const interestAmount = parent.totalAmount * interestRate;
          remainingAmount += interestAmount;
        } else if (parent.interestType === InterestType.TAE) {
          // Calculate compound interest
          const periods = parent.paymentYears;
          remainingAmount =
            parent.totalAmount * Math.pow(1 + interestRate, periods);
        }

        return remainingAmount;
      },
    });

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
