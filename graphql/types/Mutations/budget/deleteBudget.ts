import { stringArg, mutationField, nonNull, arg, floatArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("deleteBudget", {
  type: "Boolean",
  args: {
    budgetId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { budgetId }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const budget = await ctx.prisma.budget.findUnique({
      where: {
        id: budgetId,
      },
    });

    if (!budget) {
      throw new ApolloError("Budget not found.", "BUDGET_NOT_FOUND");
    }

    const budgetIsDeleted = await ctx.prisma.budget.delete({
      where: {
        id: budgetId,
      },
    });

    if (budgetIsDeleted) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "BUDGET",
          outputModelId: budget.id,
          action: "DELETE_BUDGET",
          actorId: user.id,
          message: `User deleted budget: ${budget.name} with id: ${budget.id}`,
        },
      });

      return true;
    }
    return false;
  },
});
