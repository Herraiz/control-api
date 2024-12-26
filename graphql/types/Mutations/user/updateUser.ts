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
    currency: arg({ type: "Currency" }),
  },
  authorize: authorizeFieldRequireUser,
  async resolve(
    _,
    { name, lastname, birthday, gender, newsletterOptIn, currency },
    ctx,
  ) {
    try {
      const newUser = await ctx.prisma.user.update({
        where: {
          id: ctx.user.id,
        },
        data: {
          ...(name && { name }),
          ...(lastname && { lastname }),
          ...(birthday && { birthday }),
          ...(gender && { gender }),
          ...(newsletterOptIn && { newsletterOptIn }),
          ...(currency && { currency }),
        },
      });

      if (newUser) {
        // Create ActivityLog
        const changes = [];
        if (name) changes.push(`name: ${newUser.name}`);
        if (lastname) changes.push(`lastname: ${newUser.lastname}`);
        if (birthday) changes.push(`birthday: ${newUser.birthday}`);
        if (gender) changes.push(`gender: ${newUser.gender}`);
        if (newsletterOptIn)
          changes.push(`newsletterOptIn: ${newUser.newsletterOptIn}`);
        if (currency) changes.push(`currency: ${newUser.currency}`);

        await ctx.prisma.activityLog.create({
          data: {
            inputModel: "USER",
            inputModelId: newUser.id,
            outputModel: "USER",
            outputModelId: newUser.id,
            action: "UPDATE_USER",
            actorId: newUser.id,
            message: `User updated their profile. Changes: ${changes}`,
          },
        });
      }

      return newUser;
    } catch (error) {
      console.error("graphql/mutation/updateUser:", error);
      throw new Error("Unable to update user.");
    }
  },
});
