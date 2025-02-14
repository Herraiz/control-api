import { nonNull, queryField, stringArg, list, arg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactions", {
  type: list("Transaction"),
  args: {
    userId: nonNull(stringArg()),
    orderBy: arg({ type: "String", default: "asc" }), // Argumento opcional para ordenar
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { userId, orderBy }, ctx) => {
    return ctx.prisma.transaction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: orderBy === "desc" ? "desc" : "asc", // Ordenar por fecha de creación
      },
    });
  },
});
