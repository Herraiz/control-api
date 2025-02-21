import { objectType } from "nexus";

export default objectType({
  name: "CashFlow",
  definition(t) {
    t.nonNull.int("month");
    t.nonNull.float("incomes");
    t.nonNull.float("expenses");
  },
});
