import { join } from "path";
import {
  makeSchema,
  connectionPlugin,
  fieldAuthorizePlugin,
  queryComplexityPlugin,
} from "nexus";
import * as types from "./types";

export const schema = makeSchema({
  types: [types],
  shouldGenerateArtifacts: process.env.NODE_ENV !== "production",
  prettierConfig: join(process.cwd(), ".prettierrc"),
  plugins: [
    connectionPlugin(),
    fieldAuthorizePlugin({
      formatError({ error }) {
        throw error ?? new Error("Not authorized");
      },
    }),
    queryComplexityPlugin(),
  ],
  features: {
    abstractTypeStrategies: {
      __typename: true,
    },
  },
  outputs: {
    typegen: join(
      process.cwd(),
      "node_modules",
      "@types",
      "nexus-typegen",
      "index.d.ts",
    ),
    schema: join(process.cwd(), "graphql", "schema.graphql"),
  },
  contextType: {
    export: "Context",
    module: join(process.cwd(), "graphql", "context.ts"),
  },
});
