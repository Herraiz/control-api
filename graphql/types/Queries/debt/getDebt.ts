import { nonNull, queryField, stringArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getDebt", {
  type: "Debt",
  args: {
    userId: nonNull(stringArg()),
    debtId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { debtId, userId }, ctx) => {
    if (userId !== ctx.user.id) {
      if (ctx.user.aclRole !== "ADMIN") {
        throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
      }
    }

    return ctx.prisma.debt.findFirst({
      where: {
        id: debtId,
      },
    });
  },
});
