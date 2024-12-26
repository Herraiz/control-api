import { enumType } from "nexus";

export default enumType({
  name: "IncomeType",
  members: [
    "SALARY",
    "PENSION",
    "INVESTMENT",
    "RENTAL",
    "BUSINESS",
    "FREELANCE",
    "GOVERNMENT_BENEFITS",
    "GIFTS",
    "OTHER",
  ],
});
