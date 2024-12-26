import { list, nonNull, queryField, stringArg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getBudgets", {
  type: list("Budget"),
  args: {
    userId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { userId }, ctx) => {
    return ctx.prisma.budget.findMany({
      where: {
        userId,
      },
    });
  },
});
