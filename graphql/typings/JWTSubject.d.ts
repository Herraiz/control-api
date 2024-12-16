export enum JWTSubject {
  LOGIN = "login",
  ACTIVATE = "activate",
  RESET_PASSWORD = "passwordReset",
}
export interface JWTSubjectData {
  readonly [JWTSubject.LOGIN]: Context["user"];
  readonly [JWTSubject.ACTIVATE]: { readonly userId: string };
  readonly [JWTSubject.RESET_PASSWORD]: { readonly userId: string };
}
