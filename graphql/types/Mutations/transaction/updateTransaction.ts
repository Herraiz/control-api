import { stringArg, mutationField, nonNull, arg, floatArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";
import { TransactionType } from "@prisma/client";

export default mutationField("updateTransaction", {
  type: "Transaction",
  args: {
    transactionId: nonNull(stringArg()),
    name: stringArg(),
    date: arg({ type: "DateTime" }),
    description: stringArg(),
    amount: floatArg(),
    type: arg({ type: "TransactionType" }),
    category: arg({ type: "Category" }),
    incomeType: arg({ type: "IncomeType" }),
    budgetId: stringArg(),
    debtId: stringArg(),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(
    _root,
    {
      transactionId,
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
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });

    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const oldTransaction = await ctx.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!oldTransaction) {
      throw new ApolloError("Transaction not found.", "TRANSACTION_NOT_FOUND");
    }

    if (debtId && type === TransactionType.DEBT) {
      const debt = await ctx.prisma.debt.findUnique({
        where: {
          id: debtId,
        },
      });

      if (!debt) {
        throw new ApolloError("Debt not found.", "DEBT_NOT_FOUND");
      }
    }

    if (budgetId && type === TransactionType.EXPENSE) {
      const budget = await ctx.prisma.budget.findUnique({
        where: {
          id: budgetId,
        },
      });

      if (!budget) {
        throw new ApolloError("Budget not found.", "BUDGET_NOT_FOUND");
      }
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

    // End of logics ###########

    // Prepare to update Data
    type UpdateData = {
      name?: string;
      date?: Date;
      description?: string;
      amount?: number;
      type?: TransactionType;
      category?: string;
      incomeType?: string | null;
      budget?: { connect?: { id: string }; disconnect?: boolean };
      debt?: { connect?: { id: string }; disconnect?: boolean };
    };

    const updateData: UpdateData = {
      ...(name && { name }),
      ...(date && { date }),
      ...(description && { description }),
      ...(amount && { amount }),
      ...(type && { type }),
      ...(category && { category }),
    };

    // Disconnect old relations according to the old type
    if (oldTransaction.type !== type) {
      if (oldTransaction.type === TransactionType.INCOME) {
        updateData.incomeType = null;
      }
      if (oldTransaction.type === TransactionType.EXPENSE) {
        updateData.budget = { disconnect: true };
      }
      if (oldTransaction.type === TransactionType.DEBT) {
        updateData.debt = { disconnect: true };
      }
    }

    // Connect new relations according to the new type
    if (type === TransactionType.INCOME && incomeType) {
      updateData.incomeType = incomeType;
    }
    if (type === TransactionType.EXPENSE && budgetId) {
      updateData.budget = { connect: { id: budgetId } };
    }
    if (type === TransactionType.DEBT && debtId) {
      updateData.debt = { connect: { id: debtId } };
    }

    // Update transaction
    try {
      const transaction = await ctx.prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: updateData,
      });

      if (transaction) {
        await ctx.prisma.activityLog.create({
          data: {
            inputModel: "USER",
            inputModelId: user.id,
            outputModel: "TRANSACTION",
            outputModelId: transaction.id,
            action: "UPDATE_TRANSACTION",
            actorId: user.id,
            message: `User updated transaction: ${transaction.name} with id: ${transaction.id}`,
          },
        });

        return transaction;
      }
    } catch (error) {
      console.error("Error al actualizar la transacción:", error);
      throw new ApolloError("Error updating transaction.", "UPDATE_ERROR");
    }
    return null;
  },
});
