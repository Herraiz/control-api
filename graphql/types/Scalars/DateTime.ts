import { GraphQLDateTime } from "graphql-scalars";
import { asNexusMethod } from "nexus";

const DateTime = asNexusMethod(GraphQLDateTime, "dateTime");

export default DateTime;
