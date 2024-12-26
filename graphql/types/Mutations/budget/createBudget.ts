import { stringArg, mutationField, nonNull, arg, floatArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("createBudget", {
  type: "Budget",
  args: {
    name: nonNull(stringArg()),
    amount: nonNull(floatArg()),
    category: nonNull(arg({ type: "Category" })),
    endDate: nonNull(arg({ type: "DateTime" })),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(_root, { name, amount, category, endDate }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.user.id,
      },
    });
    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    // Ensure that the endDate is not in the past
    if (new Date(endDate) < new Date()) {
      throw new ApolloError(
        "End date must be in the future.",
        "END_DATE_INVALID",
      );
    }

    const budget = await ctx.prisma.budget.create({
      data: {
        name,
        amount,
        category,
        endDate: new Date(endDate),
        user: {
          connect: {
            id: ctx.user.id,
          },
        },
      },
    });

    if (budget) {
      // Create ActivityLog
      await ctx.prisma.activityLog.create({
        data: {
          inputModel: "USER",
          inputModelId: user.id,
          outputModel: "BUDGET",
          outputModelId: budget.id,
          action: "CREATE_BUDGET",
          actorId: user.id,
          message: `User created budget: ${budget.name} with id: ${budget.id}`,
        },
      });

      return budget;
    }
    return null;
  },
});
