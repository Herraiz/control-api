import { JwtPayload } from "jsonwebtoken";
import { ApolloError } from "apollo-server-micro";
import { mutationField, nonNull, stringArg } from "nexus";
import { signData, verifyJwtWithKey } from "@/graphql/utils";
import { JWTSubject } from "@/graphql/typings";

export default mutationField("resetPasswordWithToken", {
  type: "Boolean",
  args: {
    token: nonNull(stringArg()),
    newPassword: nonNull(stringArg()),
  },
  async resolve(_, { newPassword, token }, ctx) {
    if (newPassword.length < 5) {
      throw new ApolloError(
        "Password must be at least 5 characters long.",
        "PASSWORD_TOO_SHORT",
        { minLength: 5 },
      );
    }

    try {
      const { sub } = verifyJwtWithKey<undefined, JwtPayload>(token);

      if (sub === JWTSubject.RESET_PASSWORD) {
        const data = verifyJwtWithKey(token, JWTSubject.RESET_PASSWORD);
        const user = await ctx.prisma.user.findUnique({
          where: { id: data.userId },
        });

        const hashedUserPassword = signData(`${user.email}:${newPassword}`);

        await ctx.prisma.user.update({
          where: { id: data.userId },
          data: {
            password: hashedUserPassword,
          },
        });

        return true;
      }

      throw new Error(`Unsupported subject: ${sub}`);
    } catch (error) {
      console.error("graphql/mutation/resetPasswordWithToken:", error);

      if (error instanceof ApolloError) {
        throw error;
      }

      return false;
    }
  },
});
