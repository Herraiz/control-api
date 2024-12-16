import { UserRole } from "@prisma/client";
import { Context } from "@/graphql/context";

export default function authorizeFieldUserIsAdmin(
  target: unknown,
  args: unknown,
  ctx: Context,
): boolean {
  if (ctx.meta.source === "@Bennu-Events") {
    return true;
  }

  if (ctx.user?.aclRole === UserRole.ADMIN) {
    return true;
  }

  return false;
}
