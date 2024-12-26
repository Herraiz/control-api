import { mutationField, nonNull, stringArg } from "nexus";
import {
  sendEmail,
  signJwtPayloadWithKey,
  userTimestampLock,
} from "@/graphql/utils";
import { JWTSubject } from "@/graphql/typings";

export default mutationField("requestResetPassword", {
  type: "Boolean",
  args: {
    email: nonNull(stringArg()),
  },
  // Always return true to prevent email enumeration
  async resolve(_, { email }, ctx) {
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return true;
    }

    try {
      const isFree = await userTimestampLock(ctx, user.id, "RESET_PASSWORD");
      if (!isFree) return true;

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

      sendEmail("password_recovery", { recoveryToken }, user.email);
    } catch (error) {
      console.error("graphql/mutation/requestResetPassword:", error);
    }

    return true;
  },
});
