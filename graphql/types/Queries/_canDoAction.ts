import { UserPermission, UserRole } from "@prisma/client";
import { list, nonNull, queryField, stringArg } from "nexus";
import { authorizeFieldRequireAclPermission } from "@/graphql/utils";

export default queryField("_canDoAction", {
  type: "Boolean",
  args: {
    userId: nonNull(stringArg()),
    requiredPermissions: nonNull(list(stringArg())),
  },
  async resolve(_, { userId, requiredPermissions }, ctx) {
    return (
      (await authorizeFieldRequireAclPermission(
        requiredPermissions as UserPermission[],
      )(undefined, undefined, {
        ...ctx,
        // Mock user to check permissions
        user: {
          id: userId,
          aclRole: UserRole.ADMIN,
          email: "",
        },
      })) === true
    );
  },
});
