import { mutationField } from "nexus";
import { authorizeFieldRequireUser, generateUserToken } from "@/graphql/utils";

export default mutationField("renewToken", {
  type: "String",
  authorize: authorizeFieldRequireUser,
  async resolve(_, __, ctx) {
    await ctx.prisma.loginLog.create({
      data: {
        type: "RENEW_TOKEN",
        userId: ctx.user.id,
        ip: ctx.meta.remoteAddress,
      },
    });

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    return generateUserToken(user);
  },
});
