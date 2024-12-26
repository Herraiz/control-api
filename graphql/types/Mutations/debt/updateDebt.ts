import {
  stringArg,
  mutationField,
  nonNull,
  arg,
  floatArg,
  intArg,
} from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("updateDebt", {
  type: "Debt",
  args: {
    debtId: nonNull(stringArg()),
    name: stringArg(),
    totalAmount: floatArg(),
    interestRate: floatArg(),
    interestType: arg({ type: "InterestType" }),
    paymentYears: intArg(),
    startDate: arg({ type: "DateTime" }),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(
    _root,
    {
      debtId,
      name,
      totalAmount,
      interestRate,
      interestType,
      paymentYears,
      startDate,
    },
    ctx,
  ) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });

    const oldDebt = await ctx.prisma.debt.findUnique({
      where: {
        id: debtId,
      },
    });

    if (!oldDebt) {
      throw new ApolloError("Debt not found.", "DEBT_NOT_FOUND");
    }

    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    // Ensure that the startDate is not in the future
    if (new Date(startDate) > new Date()) {
      throw new ApolloError(
        "Start date must be in the past.",
        "START_DATE_INVALID",
      );
    }

    // Ensure that the paymentYears is not negative
    if (paymentYears < 0) {
      throw new ApolloError(
        "Payment years must be a positive number.",
        "PAYMENT_YEARS_INVALID",
      );
    }

    // Ensure that the totalAmount is not negative
    if (totalAmount < 0) {
      throw new ApolloError(
        "Total amount must be a positive number.",
        "TOTAL_AMOUNT_INVALID",
      );
    }

    // Ensure that the interestAmount is not negative
    if (interestRate < 0) {
      throw new ApolloError(
        "Interest amount must be a positive number.",
        "INTEREST_AMOUNT_INVALID",
      );
    }

    const updatedDebt = await ctx.prisma.debt.update({
      where: {
        id: debtId,
      },
      data: {
        ...(name && { name }),
        ...(totalAmount && { totalAmount }),
        ...(interestRate && { interestRate }),
        ...(interestType && { interestType }),
        ...(paymentYears && { paymentYears }),
        ...(startDate && { startDate: new Date(startDate) }),
      },
    });

    if (updatedDebt) {
      // Create ActivityLog
      const changes = [];
      if (name) changes.push(`name: ${updatedDebt.name}`);
      if (totalAmount) changes.push(`totalAmount: ${updatedDebt.totalAmount}`);
      if (interestRate)
        changes.push(`interestRate: ${updatedDebt.interestRate}`);
      if (interestType)
        changes.push(`interestType: ${updatedDebt.interestType}`);
      if (paymentYears)
        changes.push(`paymentYears: ${updatedDebt.paymentYears}`);
      if (startDate) changes.push(`startDate: ${updatedDebt.startDate}`);
      const changeMessage =
        changes.length > 0 ? changes.join(", ") : "no changes";
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "DEBT",
          outputModelId: updatedDebt.id,
          action: "UPDATE_DEBT",
          actorId: user.id,
          message: `User updated debt: ${updatedDebt.id} with ${changeMessage}`,
        },
      });

      return updatedDebt;
    }
    return null;
  },
});
