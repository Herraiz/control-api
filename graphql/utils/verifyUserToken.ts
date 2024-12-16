import { Context } from "@/graphql/context";
import { JWTSubject } from "@/graphql/typings";
import verifyJwtWithKey from "./verifyJwtWithKey";

export default function verifyUserToken(
  token: string,
): Context["user"] | undefined {
  try {
    return verifyJwtWithKey(token, JWTSubject.LOGIN);
  } catch (err) {
    return undefined;
  }
}
