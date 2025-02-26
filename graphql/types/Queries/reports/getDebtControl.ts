import { list, nonNull, queryField, stringArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default queryField("getDebtControl", {
  type: list("DebtControl"),
  args: {
    userId: nonNull(stringArg()),
    debtId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,

  resolve: async (_, { userId, debtId }, ctx) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const debt = await ctx.prisma.debt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      throw new ApolloError("Debt not found", "DEBT_NOT_FOUND");
    }

    const startYear = debt.startDate.getFullYear();
    const endYear = startYear + debt.paymentYears;
    const debtControlData = [];

    const totalDebt = debt.totalAmount;
    const annualPaymentEstimate = totalDebt / debt.paymentYears;

    const actualPayments: Record<number, number> = {};

    let accumulatedActualPayments = 0;

    // Primer bucle: calcular pagos acumulados año a año
    for (let year = startYear; year <= endYear; year++) {
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          debtId,
          date: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1),
          },
        },
      });

      const yearlyPayment = transactions.reduce(
        (acc, transaction) => acc + transaction.amount,
        0,
      );

      accumulatedActualPayments += yearlyPayment;
      actualPayments[year] = accumulatedActualPayments;
    }

    // Segundo bucle: calcular estimado y estructurar la respuesta
    let remainingEstimated = totalDebt;

    for (let year = startYear; year <= endYear; year++) {
      remainingEstimated -= annualPaymentEstimate;
      remainingEstimated = Math.max(remainingEstimated, 0);

      const remainingActual = Math.max(
        totalDebt - (actualPayments[year] || 0),
        0,
      );

      debtControlData.push({
        year,
        estimatedAmount: parseFloat(remainingEstimated.toFixed(2)),
        actualAmount: parseFloat(remainingActual.toFixed(2)),
      });
    }

    return debtControlData;
  },
});
