import { stringArg, mutationField, nonNull, arg, floatArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("updateBudget", {
  type: "Budget",
  args: {
    name: stringArg(),
    amount: floatArg(),
    category: arg({ type: "Category" }),
    endDate: arg({ type: "Date" }),
    budgetId: nonNull(stringArg()),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { name, amount, category, endDate, budgetId }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const currentBudget = await ctx.prisma.budget.findUnique({
      where: {
        id: budgetId,
      },
    });

    if (!currentBudget) {
      throw new ApolloError("Budget not found.", "BUDGET_NOT_FOUND");
    }

    // Ensure that the endDate is not in the past
    if (new Date(endDate) < new Date()) {
      throw new ApolloError(
        "End date must be in the future.",
        "END_DATE_INVALID",
      );
    }

    const updatedBudget = await ctx.prisma.budget.update({
      where: {
        id: budgetId,
      },
      data: {
        ...(name && { name }),
        ...(amount && { amount }),
        ...(category && { category }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    if (updatedBudget) {
      // Create ActivityLog
      const changes = [];
      if (name) changes.push(`name: ${updatedBudget.name}`);
      if (amount) changes.push(`amount: ${updatedBudget.amount}`);
      if (category) changes.push(`category: ${updatedBudget.category}`);
      if (endDate) changes.push(`endDate: ${updatedBudget.endDate}`);

      const changeMessage =
        changes.length > 0 ? changes.join(", ") : "no changes";

      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "BUDGET",
          outputModelId: updatedBudget.id,
          action: "UPDATE_BUDGET",
          actorId: user.id,
          message: `User updated budget: ${updatedBudget.id} with ${changeMessage}`,
        },
      });

      return updatedBudget;
    }
  },
});
