import { objectType } from "nexus";

export default objectType({
  name: "TransactionsResponse",
  definition(t) {
    t.nullable.list.field("transactions", {
      type: "Transaction",
    });
    t.nonNull.int("totalCount");
    t.nonNull.int("pageSize");
  },
});
