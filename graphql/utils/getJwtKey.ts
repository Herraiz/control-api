import fs from "fs";
import path from "path";
import { logger } from "@/graphql/shared";

const cache: Record<string, string> = {};

export default function getJwtKey(getPublic = false) {
  const provider = getPublic ? "JWT_PUBLIC_KEY" : "JWT_PRIVATE_KEY";

  if (!cache[provider]) {
    const isJwtEnvAsString = process.env[provider].startsWith("-----BEGIN");

    logger.info(
      `Using JWT ${getPublic ? "public" : "private"} key from ${
        isJwtEnvAsString ? "********" : process.env[provider]
      }`,
    );

    cache[provider] = isJwtEnvAsString
      ? process.env[provider]
      : fs.readFileSync(
          path.join(process.cwd(), process.env[provider]),
          "utf8",
        );
  }

  return cache[provider];
}
