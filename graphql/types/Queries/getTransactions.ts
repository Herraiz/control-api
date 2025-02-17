import { nonNull, queryField, stringArg, list, arg, intArg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactions", {
  type: list("Transaction"),
  args: {
    userId: nonNull(stringArg()),
    orderBy: arg({ type: "String", default: "asc" }),
    limit: intArg({ default: 25 }),
    offset: intArg({ default: 0 }),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { userId, orderBy, limit, offset }, ctx) => {
    return ctx.prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: orderBy === "desc" ? "desc" : "asc",
      },
      take: limit,
      skip: offset,
    });
  },
});
