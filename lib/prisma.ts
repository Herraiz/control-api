/*
Modified this file after seeing this in console: warn(prisma-client) There are already 10 instances of Prisma Client actively running.
Following code is from official docs: https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
*/
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined; // eslint-disable-line vars-on-top
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
