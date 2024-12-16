import { arg, stringArg, booleanArg, mutationField } from "nexus";
import { authorizeFieldRequireUser } from "@/graphql/utils";

export default mutationField("updateUser", {
  type: "User",
  args: {
    name: stringArg(),
    lastname: stringArg(),
    birthday: arg({ type: "Date" }),
    gender: arg({ type: "Gender" }),
    newsletterOptIn: booleanArg(),
  },
  authorize: authorizeFieldRequireUser,
  async resolve(_, data, ctx) {
    try {
      const newUser = await ctx.prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data,
      });

      return newUser;
    } catch (error) {
      console.error("graphql/mutation/updateUser:", error);
      throw new Error("Unable to update user.");
    }
  },
});
