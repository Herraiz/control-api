import { enumType } from "nexus";

export default enumType({
  name: "UserStatus",
  members: [
    "ACTIVE",
    "INACTIVE",
    "BANNED",
    "DELETED_BY_USER",
    "DELETED_BY_ADMIN",
  ],
});
