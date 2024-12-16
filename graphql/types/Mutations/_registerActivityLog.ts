import { mutationField, nonNull, stringArg } from "nexus";
import { registerActivityLog as ral } from "@/graphql/utils";
import { Actions } from "@/graphql/utils/registerActivityLog";

export default mutationField("_registerActivityLog", {
  type: "ActivityLog",
  args: {
    action: nonNull(stringArg()),
    inputModel: nonNull(stringArg()),
    inputModelId: nonNull(stringArg()),
    outputModel: stringArg(),
    outputModelId: stringArg(),
    errorCode: stringArg(),
    errorMessage: stringArg(),
    message: stringArg(),
  },
  async resolve(
    _,
    {
      action,
      inputModel,
      inputModelId,
      outputModel,
      outputModelId,
      errorCode,
      errorMessage,
      message,
    },
    ctx,
  ) {
    const response = await ral(
      ctx,
      action as keyof Actions,
      inputModel as Actions[keyof Actions]["models"],
      inputModelId,
      {
        outputModel,
        outputModelId,
        errorCode,
        errorMessage,
        message,
      } as {
        readonly outputModel?: Actions[keyof Actions]["models"];
        readonly outputModelId?: string;
        readonly errorCode?: Actions[keyof Actions]["errorCodes"];
        readonly errorMessage?: string;
        readonly message?: string;
      },
    );

    if (response instanceof Error) {
      throw response;
    }

    return response;
  },
});
