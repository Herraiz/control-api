import { inputObjectType } from "nexus";

export default inputObjectType({
  name: "UserCreateInput",
  definition(t) {
    t.nonNull.string("email");

    t.boolean("newsletterOptIn");
    t.field("aclRole", { type: "UserRole" });
    t.string("name");
    t.string("lastname");
    t.field("birthday", { type: "Date" });
    t.field("gender", { type: "Gender" });
    t.field("status", { type: "UserStatus" });
  },
});
