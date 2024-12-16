import { Server as HTTPServer } from "http";
import { ApolloServer } from "apollo-server-micro";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";
import processRequest from "graphql-upload/processRequest.mjs";
import { schema } from "@/graphql/schema";
import { createContext } from "@/graphql/context";
import { dynamicContext } from "@/graphql/dinamicContext";

let serverCleanup: Disposable | null = null;
const apolloServer = new ApolloServer({
  context: createContext,
  persistedQueries: false,
  introspection: true,
  schema,
  plugins: [
    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup?.dispose();
          },
        };
      },
    },
  ],
});

const startServer = apolloServer.start();

const ALLOWED_HOST = ["https://studio.apollographql.com"];

export default async (
  req: Readonly<NextApiRequest>,
  res: Readonly<NextApiResponse>,
) => {
  if (
    req.method !== "OPTIONS" &&
    process.env.NODE_ENV === "production" &&
    req.headers["x-client"] !== process.env.GRAPHQL_API_GW_X_CLIENT
  ) {
    req.socket.destroy();
    return false;
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (ALLOWED_HOST.includes(req.headers.origin)) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client",
  );

  if (req.method === "OPTIONS") {
    return void res.end();
  }

  await startServer;

  const contentType = req.headers["content-type"];
  if (contentType && contentType.startsWith("multipart/form-data")) {
    // eslint-disable-next-line
    (req as any).filePayload = await processRequest(req, res);
  }

  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
};

// Apollo Server Micro takes care of body parsing
export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};
