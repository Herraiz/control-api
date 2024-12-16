import jwt, { SignOptions } from "jsonwebtoken";
import { JWTSubject } from "@/graphql/typings";
import getJwtKey from "./getJwtKey";

export default function signJwtPayloadWithKey(
  payload: Record<string, unknown>,
  subject?: JWTSubject,
  options: Omit<SignOptions, "algorithm" | "subject"> = {},
): string {
  return jwt.sign(payload, getJwtKey(), {
    algorithm: "RS256",
    expiresIn: "1m",
    subject: String(subject),
    ...options,
  });
}
