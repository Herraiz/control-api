import {
  stringArg,
  mutationField,
  nonNull,
  arg,
  floatArg,
  booleanArg,
  nullable,
} from "nexus";
import { ApolloError } from "apollo-server-micro";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default mutationField("createBudget", {
  type: "Budget",
  args: {
    userId: nonNull(stringArg()),
    name: nonNull(stringArg()),
    amount: nonNull(floatArg()),
    category: nonNull(arg({ type: "Category" })),
    isRecurring: nonNull(booleanArg()),
    recurringStartDate: nullable(arg({ type: "DateTime" })),
  },
  authorize: authorizeFieldCurrentUser,
  async resolve(
    _root,
    { userId, name, amount, category, isRecurring, recurringStartDate },
    ctx,
  ) {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    if (isRecurring && !recurringStartDate) {
      throw new ApolloError(
        "Recurring budgets must have a recurringStartDate.",
        "MISSING_RECURRING_START_DATE",
      );
    }

    const budget = await ctx.prisma.budget.create({
      data: {
        name,
        amount,
        category,
        isRecurring,
        recurringStartDate: isRecurring ? new Date(recurringStartDate) : null,
        user: {
          connect: { id: userId },
        },
      },
    });

    await ctx.prisma.activityLog.create({
      data: {
        inputModel: "USER",
        inputModelId: userId,
        outputModel: "BUDGET",
        outputModelId: budget.id,
        action: "CREATE_BUDGET",
        actorId: userId,
        message: `User created budget: ${budget.name} with id: ${budget.id}`,
      },
    });

    return budget;
  },
});
