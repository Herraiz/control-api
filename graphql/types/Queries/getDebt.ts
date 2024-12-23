import { nonNull, queryField, stringArg } from "nexus";
import {
  authorizeFieldCurrentUser,
  orComposeAuthorize,
  authorizeFieldUserIsAdmin,
} from "@/graphql/utils";

export default queryField("getDebt", {
  type: "Debt",
  args: {
    debtId: nonNull(stringArg()),
  },
  authorize: orComposeAuthorize(
    authorizeFieldCurrentUser,
    authorizeFieldUserIsAdmin,
  ),
  resolve: async (_, { debtId }, ctx) => {
    return ctx.prisma.debt.findFirst({
      where: {
        id: debtId,
      },
    });
  },
});
