import { mutationField, nonNull, stringArg } from "nexus";
import bcrypt from "bcrypt";
import {
  registerActivityLog as ral,
  authorizeFieldRequireUser,
} from "@/graphql/utils";

export default mutationField("requestUserDelete", {
  type: "Boolean",
  args: {
    password: nonNull(stringArg()),
  },
  authorize: authorizeFieldRequireUser,
  async resolve(_, { password }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (user.deletedAt) {
      throw await ral(ctx, "RequestDeleteUser", "User", ctx.user.id, {
        errorMessage: "The user was already marked as deleted.",
        errorCode: "USER_ALREADY_MARKED_AS_DELETED",
      });
    }

    const passwordValid = bcrypt.compareSync(
      `${ctx.user.email}:${password}`,
      user.password,
    );

    if (!passwordValid) {
      throw await ral(ctx, "RequestDeleteUser", "User", ctx.user.id, {
        errorMessage: "Invalid user password.",
        errorCode: "INVALID_PASSWORD",
      });
    }

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        name: null,
        lastname: null,
        status: "DELETED_BY_USER",
        email: `deleted-${ctx.user.id}`,
        birthday: null,
        gender: null,
        deletedAt: new Date(),
      },
    });

    return true;
  },
});
