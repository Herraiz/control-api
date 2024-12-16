import { ApolloError } from "apollo-server-micro";
import {
  generateUserToken,
  sendEmail,
  signData,
  signJwtPayloadWithKey,
  validateEmail,
} from "@/graphql/utils";
import { JWTSubject } from "@/graphql/typings";
import { Context } from "@/graphql/context";
import { logger } from "@/graphql/shared";

export default async function registerUser(
  ctx: Context,
  {
    email: rawEmail,
    password,
    newsletter = false,
  }: {
    readonly email: string;
    readonly password: string;
    readonly newsletter?: boolean;
  },
  fromExternal = false,
) {
  const email = rawEmail.toLocaleLowerCase();

  if (!validateEmail(email)) {
    throw new ApolloError("Invalid email format.", "INVALID_EMAIL_FORMAT");
  }

  if (password.length < 5) {
    throw new ApolloError(
      "Password must be at least 5 characters long.",
      "PASSWORD_TOO_SHORT",
      { minLength: 5 },
    );
  }

  const user = await ctx.prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    throw new ApolloError("User already exists.", "USER_EXISTS");
  }

  try {
    const hashedUserPassword = signData(`${email}:${password}`);

    const newUser = await ctx.prisma.user.create({
      data: {
        email,
        password: hashedUserPassword,
        newsletterOptIn: !!newsletter,
      },
    });

    const activationToken = signJwtPayloadWithKey(
      { userId: newUser.id },
      JWTSubject.ACTIVATE,
      { expiresIn: "1d" },
    );

    logger.debug(`graphql/mutation/registerUser: User ${email} created.`);

    if (!fromExternal) {
      sendEmail("user_registered", { activationToken }, email);
    }

    const token = generateUserToken(newUser);

    ctx.user = newUser;

    return {
      token,
      user: newUser,
    };
  } catch (error) {
    logger.error("graphql/mutation/registerUser:", error);
    throw new Error("Failed to create user.");
  }
}
