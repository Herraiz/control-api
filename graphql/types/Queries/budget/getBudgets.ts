import { list, nonNull, queryField, stringArg, intArg, nullable } from "nexus";
import { ApolloError } from "apollo-server-micro";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getBudgets", {
  type: list("Budget"),
  args: {
    userId: nonNull(stringArg()),
    month: nullable(intArg()),
    year: nullable(intArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { userId, month, year }, ctx) => {
    if (userId !== ctx.user.id) {
      throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
    }

    const now = new Date();
    const monthFilter = month ?? now.getMonth() + 1;
    const yearFilter = year ?? now.getFullYear();

    return ctx.prisma.budget.findMany({
      where: {
        userId,
        OR: [
          {
            isRecurring: true,
            recurringStartDate: { lte: new Date(yearFilter, monthFilter, 0) },
          },
          {
            isRecurring: false,
            createdAt: {
              gte: new Date(yearFilter, monthFilter - 1, 1),
              lt: new Date(yearFilter, monthFilter, 1),
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },
});
