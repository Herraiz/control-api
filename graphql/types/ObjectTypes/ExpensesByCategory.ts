import { objectType } from "nexus";

export default objectType({
  name: "ExpensesByCategory",
  definition(t) {
    t.nonNull.field("category", { type: "Category" });
    t.nonNull.float("total");
  },
});
