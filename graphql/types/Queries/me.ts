import { queryField, stringArg } from "nexus";
import { authorizeFieldRequireUser } from "@/graphql/utils";

export default queryField("me", {
  type: "User",
  args: {
    appId: stringArg(),
  },
  authorize: authorizeFieldRequireUser,
  resolve: async (_, __, ctx) => {
    return ctx.prisma.user.findUnique({
      where: { id: ctx.user.id, deletedAt: null },
    });
  },
});
