import { objectType } from "nexus";

export default objectType({
  name: "LoginResponse",
  definition(t) {
    t.string("token");
    t.field("user", {
      type: "User",
    });
  },
});
