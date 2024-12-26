import { list, nonNull, objectType } from "nexus";
import { authorizeFieldCurrentUser } from "@/graphql/utils";

export default objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.nullable.string("name", {
      authorize: authorizeFieldCurrentUser,
    });
    t.nullable.string("lastname", {
      authorize: authorizeFieldCurrentUser,
    });

    // Private fields
    t.string("email", {
      authorize: authorizeFieldCurrentUser,
    });
    t.field("aclRole", {
      type: "UserRole",
      authorize: authorizeFieldCurrentUser,
    });

    t.boolean("newsletterOptIn", {
      authorize: authorizeFieldCurrentUser,
    });

    t.nullable.date("birthday", {
      authorize: authorizeFieldCurrentUser,
    });
    t.nullable.field("gender", {
      type: "Gender",
      authorize: authorizeFieldCurrentUser,
    });
    t.nullable.field("currency", {
      type: "Currency",
      authorize: authorizeFieldCurrentUser,
    });
    t.field("status", {
      type: "UserStatus",
      authorize: authorizeFieldCurrentUser,
    });
    t.dateTime("deletedAt", {
      authorize: authorizeFieldCurrentUser,
    });
    t.dateTime("createdAt", {
      authorize: authorizeFieldCurrentUser,
    });
    t.dateTime("updatedAt", {
      authorize: authorizeFieldCurrentUser,
    });
  },
});
