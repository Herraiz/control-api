import { objectType } from "nexus";

export default objectType({
  name: "BudgetExpensesControl",
  definition(t) {
    t.nonNull.int("month");
    t.nonNull.float("amount");
    t.nonNull.float("expenses");
  },
});
