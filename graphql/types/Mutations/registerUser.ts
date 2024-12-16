import { nonNull, stringArg, booleanArg, mutationField } from "nexus";
import { registerUser } from "@/graphql/common/resolvers";

export default mutationField("registerUser", {
  type: "RegisterResponse",
  args: {
    email: nonNull(stringArg()),
    password: nonNull(stringArg()),
    newsletter: booleanArg(),
  },
  async resolve(_, args, ctx) {
    return registerUser(ctx, args);
  },
});
