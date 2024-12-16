import { JWTSubject } from "@/graphql/typings";
import { Context } from "@/graphql/context";
import signJwtPayloadWithKey from "./signJwtPayloadWithKey";

export default function generateUserToken(
  user: Context["user"],
  expiresIn = "7d",
): string {
  return signJwtPayloadWithKey(
    {
      id: user.id,
      email: user.email,
      aclRole: user.aclRole,
    } as Context["user"],
    JWTSubject.LOGIN,
    {
      expiresIn,
    },
  );
}
