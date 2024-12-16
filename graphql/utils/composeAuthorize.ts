import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";

export default function composeAuthorize<
  TypeName extends string,
  FieldName extends string,
>(...fns: readonly FieldAuthorizeResolver<TypeName, FieldName>[]) {
  return async (
    ...args: Parameters<FieldAuthorizeResolver<TypeName, FieldName>>
  ) => {
    for await (const f of fns) {
      const response = await f(...args);
      if (response !== true) return response;
    }

    return true;
  };
}
