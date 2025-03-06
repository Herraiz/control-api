import { objectType } from "nexus";

export default objectType({
  name: "AvailableBudgetDates",
  definition(t) {
    t.nonNull.int("year");
    t.nonNull.list.int("months");
  },
});
