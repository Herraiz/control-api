import { nonNull, nullable, queryField, stringArg, arg, intArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getTransactions", {
  type: "TransactionsResponse",
  args: {
    userId: nonNull(stringArg()),
    type: nullable(arg({ type: "TransactionType" })),
    orderBy: arg({ type: "String", default: "asc" }),
    limit: intArg({ default: 25 }),
    page: intArg({ default: 0 }),
    searchTerm: nullable(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (
    _,
    { userId, orderBy, limit, page, type, searchTerm },
    ctx,
  ) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const where = {
      userId,
      ...(type && { type }), // Si hay filtro de tipo, se agrega
      ...(searchTerm && {
        name: { contains: searchTerm, mode: "insensitive" },
      }), // Búsqueda insensible a mayúsculas/minúsculas
    };

    const skip: number = page ? (page - 1) * limit : 0;

    const transactions = await ctx.prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: orderBy === "desc" ? "desc" : "asc",
      },
      take: limit,
      skip,
    });

    const totalCount: number = await ctx.prisma.transaction.count({
      where,
    });

    return {
      transactions,
      totalCount,
      pageSize: limit,
    };
  },
});
