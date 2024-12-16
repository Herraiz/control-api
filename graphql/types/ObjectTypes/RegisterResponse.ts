import { objectType } from "nexus";

export default objectType({
  name: "RegisterResponse",
  definition(t) {
    t.string("token");
    t.field("user", {
      type: "User",
    });
  },
});
