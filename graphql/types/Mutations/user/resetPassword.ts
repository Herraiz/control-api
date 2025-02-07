import { mutationField, nonNull, stringArg } from "nexus";
import { ApolloError } from "apollo-server-micro";
import bcrypt from "bcrypt";
import { authorizeFieldCurrentUser, signData } from "@/graphql/utils";

export default mutationField("resetPassword", {
  type: "Boolean",
  args: {
    oldPassword: nonNull(stringArg()),
    newPassword: nonNull(stringArg()),
  },
  authorize: (root, args, ctx) =>
    authorizeFieldCurrentUser({ userId: ctx.user.id }, args, ctx),
  async resolve(_, { oldPassword, newPassword }, ctx) {
    if (newPassword.length < 5) {
      throw new ApolloError(
        "Password must be at least 5 characters long.",
        "PASSWORD_TOO_SHORT",
        { minLength: 5 },
      );
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new ApolloError("User not found.", "USER_NOT_FOUND");
    }

    const passwordValid = bcrypt.compareSync(
      `${user.email}:${oldPassword}`,
      user.password,
    );

    if (!passwordValid) {
      throw new ApolloError("Invalid old password.", "INVALID_OLD_PASSWORD");
    }

    const hashedUserPassword = signData(`${user.email}:${newPassword}`);

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        password: hashedUserPassword,
      },
    });

    return true;
  },
});
