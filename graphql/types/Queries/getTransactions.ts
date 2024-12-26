import { nonNull, queryField, stringArg, list } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactions", {
  type: list("Transaction"),
  args: {
    userId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { userId }, ctx) => {
    return ctx.prisma.transaction.findMany({
      where: {
        userId,
      },
    });
  },
});
