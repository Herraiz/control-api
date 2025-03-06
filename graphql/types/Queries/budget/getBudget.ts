import { nonNull, queryField, stringArg, intArg, nullable } from "nexus";
import { ApolloError } from "apollo-server-micro";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getBudget", {
  type: "Budget",
  args: {
    userId: nonNull(stringArg()),
    budgetId: nonNull(stringArg()),
    month: nullable(intArg()),
    year: nullable(intArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { budgetId, userId }, ctx) => {
    // Verificar autorización
    if (userId !== ctx.user.id) {
      if (ctx.user.aclRole !== "ADMIN") {
        throw new ApolloError("Unauthorized", "UNAUTHORIZED_NOT_SAME_USER");
      }
    }

    // Buscar el presupuesto
    const budget = await ctx.prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    });

    if (!budget) {
      throw new ApolloError("Budget not found.", "BUDGET_NOT_FOUND");
    }

    return budget; // Devuelve el objeto Budget, el cual manejará transactions y balance internamente
  },
});
