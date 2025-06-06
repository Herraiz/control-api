import { objectType } from "nexus";

export default objectType({
  name: "TransactionClassification",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.dateTime("date");
    t.nullable.string("description");
    t.nonNull.float("amount");
    t.nonNull.field("type", {
      type: "TransactionType",
    });
    t.nullable.field("category", {
      type: "Category",
    });
    t.nullable.field("incomeType", {
      type: "IncomeType",
    });

    t.nullable.string("budgetId");
    t.nullable.string("debtId");
  },
});
