import { nonNull, queryField, stringArg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getBudget", {
  type: "Budget",
  args: {
    budgetId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { budgetId }, ctx) => {
    return ctx.prisma.budget.findFirst({
      where: {
        id: budgetId,
      },
    });
  },
});
