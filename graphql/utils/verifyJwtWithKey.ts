import jwt from "jsonwebtoken";
import { JWTSubject, JWTSubjectData } from "@/graphql/typings";
import getJwtKey from "./getJwtKey";

export default function verifyJwtWithKey<
  S extends JWTSubject,
  R extends JWTSubjectData[S],
>(token: string, subject?: S): R {
  return jwt.verify(token, getJwtKey(true), {
    subject: subject ? String(subject) : undefined,
  }) as R;
}
