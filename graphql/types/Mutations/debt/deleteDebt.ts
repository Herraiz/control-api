import { stringArg, mutationField, nonNull, arg, floatArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("deleteDebt", {
  type: "Boolean",
  args: {
    debtId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { debtId }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const debt = await ctx.prisma.debt.findUnique({
      where: {
        id: debtId,
      },
    });

    if (!debt) {
      throw new ApolloError("DEBT not found.", "DEBT_NOT_FOUND");
    }

    const debtIsDeleted = await ctx.prisma.debt.delete({
      where: {
        id: debtId,
      },
    });

    if (debtIsDeleted) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "DEBT",
          outputModelId: debt.id,
          action: "DELETE_DEBT",
          actorId: user.id,
          message: `User deleted debt: ${debt.name} with id: ${debt.id}`,
        },
      });

      return true;
    }
    return false;
  },
});
