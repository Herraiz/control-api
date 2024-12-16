import { Context } from "@/graphql/context";

export default function authorizeFieldRequireUser(
  any: unknown,
  args: unknown,
  ctx: Context,
): boolean {
  return !!ctx.user?.id;
}
