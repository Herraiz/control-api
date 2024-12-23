import { nonNull, queryField, stringArg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransaction", {
  type: "Transaction",
  args: {
    transactionId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { transactionId }, ctx) => {
    return ctx.prisma.transaction.findFirst({
      where: {
        id: transactionId,
      },
    });
  },
});
