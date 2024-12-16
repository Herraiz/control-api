import { ServerResponse } from "http";
import { PrismaClient, User } from "@prisma/client";
import { MicroRequest } from "apollo-server-micro/dist/types";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/graphql/utils";

export interface Context {
  // Keep user as writable
  // eslint-disable-next-line functional/prefer-readonly-type
  user?: Pick<User, "id" | "email" | "aclRole">;
  readonly prisma: PrismaClient;

  readonly meta: {
    readonly remoteAddress: string;
    readonly remoteClientIdentity: string | undefined;
    readonly source: undefined;
  };
}
export function createContext({
  req,
}: {
  readonly req: MicroRequest;
  readonly res: ServerResponse;
}): Context {
  const tokenWithBearer = req.headers.authorization || "";
  const token = tokenWithBearer.split(" ")[1];
  const user = token ? verifyUserToken(token) : undefined;

  return {
    user,
    prisma,
    meta: {
      remoteAddress: req.headers["x-forwarded-for"]
        ? String(req.headers["x-forwarded-for"]).split(", ")[0]
        : req.socket.remoteAddress,
      remoteClientIdentity: req.headers["x-client"]
        ? String(req.headers["x-client"])
        : undefined,
      source: req.headers["x-source"]
        ? (String(req.headers["x-source"]) as Context["meta"]["source"])
        : undefined,
    },
  };
}
