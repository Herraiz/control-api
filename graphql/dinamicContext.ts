import { PrismaClient, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/graphql/utils";

export interface Context {
  // Keep user as writable
  // eslint-disable-next-line functional/prefer-readonly-type
  user?: Pick<User, "id" | "email" | "aclRole">;
  readonly prisma: PrismaClient;
}
export function dynamicContext(ctx): Context {
  const tokenChain =
    ctx.connectionParams.authorization || ctx.connectionParams.Authorization;
  let user = undefined;
  if (tokenChain) {
    const token = tokenChain.split(" ")[1];

    user = token ? verifyUserToken(token) : undefined;
  }
  return {
    user,
    prisma,
  };
}
