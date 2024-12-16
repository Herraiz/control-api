import { JSONResolver } from "graphql-scalars";
import { asNexusMethod } from "nexus";

export default asNexusMethod(JSONResolver, "json");
