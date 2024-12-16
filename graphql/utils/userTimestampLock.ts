import { UserTimestampActionType } from "@prisma/client";
import { Context } from "@/graphql/context";

export default async function userTimestampLock(
  ctx: Context,
  userId: string,
  actionType: UserTimestampActionType,
): Promise<boolean> {
  const timestampAction = await ctx.prisma.userTimestampAction.findUnique({
    where: {
      userId_actionType: {
        userId,
        actionType,
      },
    },
  });

  if (timestampAction) {
    const diffTime = Math.abs(Date.now() - timestampAction.sendAt.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours < 24) {
      return false;
    }
  }

  await ctx.prisma.userTimestampAction.upsert({
    where: {
      userId_actionType: {
        userId,
        actionType,
      },
    },
    update: {},
    create: {
      userId,
      actionType,
    },
  });

  return true;
}
