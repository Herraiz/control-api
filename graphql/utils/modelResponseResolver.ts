import { prisma } from "@/lib/prisma";
import { Context } from "../context";

export default function modelResponseResolver<
  K extends string,
  IK extends string,
>(sourceModelKey: K, sourceModelIdKey: IK) {
  return async (source: Record<string, string>, _: unknown, ctx: Context) => {
    const prismaModel = source[sourceModelKey].toLowerCase();
    const response = await prisma[prismaModel].findUnique({
      where: { id: source[sourceModelIdKey as unknown as K] },
    });
    return { __typename: source[sourceModelKey], ...response };
  };
}
