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

export default mutationField("createDebt", {
  type: "Debt",
  args: {
    name: nonNull(stringArg()),
    totalAmount: nonNull(floatArg()),
    interestRate: nonNull(floatArg()),
    interestType: nonNull(arg({ type: "InterestType" })),
    paymentYears: nonNull(intArg()),
    startDate: nonNull(arg({ type: "DateTime" })),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(
    _root,
    { name, totalAmount, interestRate, interestType, paymentYears, startDate },
    ctx,
  ) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
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

    const debt = await ctx.prisma.debt.create({
      data: {
        name,
        totalAmount,
        interestRate,
        interestType,
        paymentYears,
        startDate: new Date(startDate),
        user: {
          connect: {
            id: ctx.user.id,
          },
        },
      },
    });

    if (debt) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "DEBT",
          outputModelId: debt.id,
          action: "CREATE_DEBT",
          actorId: user.id,
          message: `User created debt: ${debt.name} with id: ${debt.id}`,
        },
      });

      return debt;
    }
    return null;
  },
});
