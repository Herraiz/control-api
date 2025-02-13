import {
  stringArg,
  mutationField,
  nonNull,
  arg,
  floatArg,
  nullable,
} from "nexus";
import { ApolloError } from "apollo-server-micro";
import { TransactionType } from "@prisma/client";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("createTransaction", {
  type: "Transaction",
  args: {
    userId: nonNull(stringArg()),
    name: nonNull(stringArg()),
    date: nonNull(arg({ type: "DateTime" })),
    description: stringArg(),
    amount: nonNull(floatArg()),
    type: nonNull(arg({ type: "TransactionType" })),
    category: nullable(arg({ type: "Category" })),
    incomeType: arg({ type: "IncomeType" }),
    budgetId: stringArg(),
    debtId: stringArg(),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(
    _root,
    {
      userId,
      name,
      date,
      description,
      amount,
      type,
      category,
      incomeType,
      budgetId,
      debtId,
    },
    ctx,
  ) {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    // Logic of debts, expenses and incomes ###########

    switch (type) {
      case TransactionType.EXPENSE:
        // can have a budget or not
        break;

      case TransactionType.INCOME:
        // incomeType is mandatory
        if (!incomeType) {
          throw new ApolloError(
            "Income type is required for incomes.",
            "INCOME_TYPE_REQUIRED",
          );
        }
        break;

      case TransactionType.DEBT:
        // debtId is mandatory
        if (!debtId) {
          throw new ApolloError("Debt is required for debts.", "DEBT_REQUIRED");
        }
        break;

      default:
        throw new ApolloError("Invalid transaction type.", "INVALID_TYPE");
    }

    // Ensure category is provided if type is not DEBT or INCOME
    if (
      type !== TransactionType.DEBT &&
      type !== TransactionType.INCOME &&
      !category
    ) {
      throw new ApolloError(
        "Category is required for non-debt and non-income transactions.",
        "CATEGORY_REQUIRED",
      );
    }

    // End of logics ###########

    const transaction = await ctx.prisma.transaction.create({
      data: {
        name,
        date,
        ...(description && { description }),
        amount,
        type,

        ...(type !== TransactionType.DEBT &&
          type !== TransactionType.INCOME && { category }),

        ...(type === TransactionType.INCOME && incomeType
          ? { incomeType }
          : {}),

        ...(type === TransactionType.EXPENSE && budgetId
          ? {
              budget: {
                connect: {
                  id: budgetId,
                },
              },
            }
          : {}),

        ...(type === TransactionType.DEBT && debtId
          ? { debt: { connect: { id: debtId } } }
          : {}),

        user: {
          connect: {
            id: ctx.user.id,
          },
        },
      },
    });

    if (transaction) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "TRANSACTION",
          outputModelId: transaction.id,
          action: "CREATE_TRANSACTION",
          actorId: user.id,
          message: `User created transaction: ${transaction.name} with id: ${transaction.id}`,
        },
      });

      return transaction;
    }
    return null;
  },
});
