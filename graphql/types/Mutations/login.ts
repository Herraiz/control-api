import { ApolloError } from "apollo-server-micro";
import bcrypt from "bcrypt";
import { nonNull, stringArg, mutationField } from "nexus";
import {
  generateUserToken,
  sendEmail,
  // signData,
  signJwtPayloadWithKey,
  userTimestampLock,
} from "@/graphql/utils";
// import { resolvers } from "@/graphql/common";
import { JWTSubject } from "@/graphql/typings";

export default mutationField("login", {
  type: "LoginResponse",
  args: {
    email: nonNull(stringArg()),
    password: nonNull(stringArg()),
  },
  async resolve(_, { email: rawEmail, password }, ctx) {
    const email = rawEmail.toLocaleLowerCase();

    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ApolloError("Invalid credentials.", "INVALID_CREDENTIALS");
    }

    if (user?.deletedAt !== null) {
      throw new ApolloError("This user is deleted.", "USER_MARKED_AS_DELETED");
    }

    if (user?.status !== "ACTIVE") {
      throw new ApolloError("This user is not active.", "USER_NOT_ACTIVE");
    }

    if (!user?.password) {
      const isFree = await userTimestampLock(ctx, user.id, "RESET_PASSWORD");
      if (!isFree)
        throw new ApolloError(
          "User don't have password.",
          "USER_DONT_HAVE_PASSWORD",
        );

      const recoveryToken = signJwtPayloadWithKey(
        { userId: user.id },
        JWTSubject.RESET_PASSWORD,
        { expiresIn: "2d" },
      );

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `graphql/mutation/sendActivation: Activate token: ${recoveryToken}`,
        );
      }

      await sendEmail("reactivate_user", { recoveryToken }, user.email);
      throw new ApolloError(
        "User don't have password.",
        "USER_DONT_HAVE_PASSWORD",
      );
    }

    const passwordValid = bcrypt.compareSync(
      `${email}:${password}`,
      user.password,
    );

    if (!passwordValid) {
      throw new ApolloError("Invalid credentials.", "INVALID_CREDENTIALS");
    }

    await ctx.prisma.loginLog.create({
      data: {
        type: "NEW_TOKEN",
        userId: user.id,
        ip: ctx.meta.remoteAddress,
      },
    });

    const token = generateUserToken(user);

    ctx.user = user;

    return {
      token,
      user,
    };
  },
});
