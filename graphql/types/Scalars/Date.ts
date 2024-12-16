import { GraphQLDate } from "graphql-scalars";
import { asNexusMethod } from "nexus";

const Date = asNexusMethod(GraphQLDate, "date");

export default Date;
