import { InterestType } from "@prisma/client";
import { objectType } from "nexus";

export default objectType({
  name: "Debt",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("name");
    t.nonNull.float("totalAmount"); // Monto inicial de la deuda
    t.nonNull.float("interestRate"); // Tasa de interés
    t.nonNull.field("interestType", {
      type: "InterestType",
    });
    t.nonNull.int("paymentYears"); // Número de años para pagar
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

    // Intereses acumulados a lo largo del período de pago
    t.float("interestAmount", {
      resolve: async (parent) => {
        const interestRate = parent.interestRate / 100;
        let interestAmount = 0;

        if (parent.interestType === InterestType.TIN) {
          interestAmount =
            parent.totalAmount * interestRate * parent.paymentYears;
        } else if (parent.interestType === InterestType.TAE) {
          interestAmount =
            parent.totalAmount *
              Math.pow(1 + interestRate, parent.paymentYears) -
            parent.totalAmount;
        }

        return parseFloat(interestAmount.toFixed(2));
      },
    });

    // Total a pagar sumando la deuda original y los intereses acumulados
    t.float("totalDebtAmount", {
      resolve: async (parent) => {
        const interestRate = parent.interestRate / 100;
        let interestAmount = 0;

        if (parent.interestType === InterestType.TIN) {
          interestAmount =
            parent.totalAmount * interestRate * parent.paymentYears;
        } else if (parent.interestType === InterestType.TAE) {
          interestAmount =
            parent.totalAmount *
              Math.pow(1 + interestRate, parent.paymentYears) -
            parent.totalAmount;
        }

        const totalDebt = parent.totalAmount + interestAmount;
        return parseFloat(totalDebt.toFixed(2));
      },
    });

    // Total pagado hasta el momento
    t.float("totalPaidAmount", {
      resolve: async (parent, _args, ctx) => {
        const transactions = await ctx.prisma.transaction.findMany({
          where: {
            debtId: parent.id,
          },
        });

        const totalPaid = transactions.reduce(
          (acc, transaction) => acc + transaction.amount,
          0,
        );

        return parseFloat(totalPaid.toFixed(2));
      },
    });

    // Deuda restante = Total a pagar - Total pagado (pero sin permitir negativos)
    t.float("remainingDebt", {
      resolve: async (parent, _args, ctx) => {
        const interestRate = parent.interestRate / 100;
        let interestAmount = 0;

        if (parent.interestType === InterestType.TIN) {
          interestAmount =
            parent.totalAmount * interestRate * parent.paymentYears;
        } else if (parent.interestType === InterestType.TAE) {
          interestAmount =
            parent.totalAmount *
              Math.pow(1 + interestRate, parent.paymentYears) -
            parent.totalAmount;
        }

        const totalDebtAmount = parent.totalAmount + interestAmount;

        const transactions = await ctx.prisma.transaction.findMany({
          where: {
            debtId: parent.id,
          },
        });

        const totalPaidAmount = transactions.reduce(
          (acc, transaction) => acc + transaction.amount,
          0,
        );

        const remainingDebt = Math.max(totalDebtAmount - totalPaidAmount, 0);
        return parseFloat(remainingDebt.toFixed(2));
      },
    });

    t.dateTime("createdAt");
    t.dateTime("updatedAt");
  },
});
