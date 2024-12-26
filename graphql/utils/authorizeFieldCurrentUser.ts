import { User, UserRole } from "@prisma/client";
import { Context } from "@/graphql/context";

export default function authorizeFieldCurrentUser(
  target: Partial<Pick<User, "id"> | Record<"userId", string>>,
  args: Partial<Record<"userId", string>>,
  ctx: Context,
): boolean {
  if (ctx.meta?.source === "@Bennu-Events") {
    return true;
  }

  if ([UserRole.ADMIN].includes(ctx.user.aclRole!)) {
    return true;
  }

  if ("userId" in target) {
    return target.userId === ctx.user?.id;
  }

  if ("id" in target) {
    return target.id === ctx.user?.id;
  }
  if ("userId" in args) {
    return args.userId === ctx.user?.id;
  }

  return false;
}
