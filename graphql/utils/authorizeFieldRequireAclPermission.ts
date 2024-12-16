import { UserPermission, UserRole } from "@prisma/client";
import { Context } from "@/graphql/context";

export default function authorizeFieldRequireAclPermission(
  requiredPermissions: readonly UserPermission[],
) {
  return async (
    any: unknown,
    args: unknown,
    ctx: Context,
  ): Promise<boolean | Error> => {
    if (ctx.user?.aclRole !== UserRole.ADMIN) return false;

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        aclGroups: true,
      },
    });

    const userPermissions = user.aclGroups
      .map((aclGroup) => aclGroup.permissions)
      .flat();

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  };
}
