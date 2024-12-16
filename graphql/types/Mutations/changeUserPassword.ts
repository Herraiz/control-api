import { mutationField, nonNull, stringArg } from "nexus";
import { authorizeFieldUserIsAdmin, signData } from "@/graphql/utils";

export default mutationField("changeUserPassword", {
  type: "Boolean",
  args: {
    userId: nonNull(stringArg()),
    newPassword: nonNull(stringArg()),
  },
  authorize: authorizeFieldUserIsAdmin,
  async resolve(_, { userId, newPassword }, ctx) {
    if (newPassword === "") {
      console.error("graphql/mutation/changeUserPassword");
      throw new Error("The new password cannot be empty string.");
    }
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    await ctx.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: signData(`${user.email}:${newPassword}`),
      },
    });

    return true;
  },
});
