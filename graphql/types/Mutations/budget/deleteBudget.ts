import { stringArg, mutationField, nonNull } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("deleteBudget", {
  type: "Boolean",
  args: {
    userId: nonNull(stringArg()),
    budgetId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { userId, budgetId }, ctx) {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const budget = await ctx.prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new ApolloError("Budget not found.", "BUDGET_NOT_FOUND");
    }

    await ctx.prisma.budget.delete({ where: { id: budgetId } });

    await ctx.prisma.activityLog.create({
      data: {
        inputModel: "USER",
        inputModelId: userId,
        outputModel: "BUDGET",
        outputModelId: budgetId,
        action: "DELETE_BUDGET",
        actorId: userId,
        message: `User deleted budget: ${budget.name} with id: ${budget.id}`,
      },
    });

    return true;
  },
});
