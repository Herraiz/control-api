import { objectType } from "nexus";

export default objectType({
  name: "ActivityLog",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("inputModel");
    t.nonNull.string("inputModelId");
    t.nonNull.string("action");
    t.string("outputModel");
    t.string("outputModelId");
    t.string("errorCode");
    t.string("errorMessage");
    t.string("message");
    t.string("actorId");
    t.date("createdAt");
  },
});
