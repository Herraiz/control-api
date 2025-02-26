import { objectType } from "nexus";

export default objectType({
  name: "DebtControl",
  definition(t) {
    t.nullable.int("year");
    t.nonNull.float("estimatedAmount");
    t.nonNull.float("actualAmount");
  },
});
