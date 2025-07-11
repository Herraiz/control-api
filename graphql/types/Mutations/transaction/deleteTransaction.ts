import { stringArg, mutationField, nonNull } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("deleteTransaction", {
  type: "Boolean",
  args: {
    transactionId: nonNull(stringArg()),
    userId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { transactionId, userId }, ctx) {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const transaction = await ctx.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new ApolloError("Transaction not found.", "TRANSACTION_NOT_FOUND");
    }

    const transactionIsDeleted = await ctx.prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });

    if (transactionIsDeleted) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "TRANSACTION",
          outputModelId: transaction.id,
          action: "DELETE_TRANSACTION",
          actorId: user.id,
          message: `User deleted transaction: ${transaction.name} with id: ${transaction.id}`,
        },
      });

      return true;
    }
    return false;
  },
});
