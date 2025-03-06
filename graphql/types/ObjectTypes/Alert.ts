import { objectType } from "nexus";

export default objectType({
  name: "Alert",
  definition(t) {
    t.nonNull.field("user", { type: "User" });
    t.nonNull.string("userId");
    t.nonNull.field("type", { type: "AlertType" });
    t.nonNull.field("budget", { type: "Budget" });
    t.nonNull.float("expenses");
    t.nonNull.string("budgetId");
  },
});
