import { enumType } from "nexus";

export default enumType({
  name: "TransactionType",
  members: ["INCOME", "EXPENSE", "DEBT"],
});
