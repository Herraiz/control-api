import { ActivityLog } from "@prisma/client";
import { ApolloError } from "apollo-server-micro";
import { Context } from "../context";
import { logger } from "../shared";

export interface Actions {
  readonly ActivateUser: {
    readonly models: "User";
    readonly errorCodes: "INVALID_JWT";
  };
  readonly RequestDeleteUser: {
    readonly models: "User";
    readonly errorCodes: "INVALID_PASSWORD" | "USER_ALREADY_MARKED_AS_DELETED";
  };

  readonly DeleteUser: {
    readonly models: "User";
    readonly errorCodes: never;
  };
}

export default async function registerActivityLog<A extends keyof Actions>(
  ctx: Readonly<Context>,
  action: A,
  inputModel: Actions[A]["models"],
  inputModelId: string,
  {
    outputModel,
    outputModelId,
    errorCode,
    errorMessage,
    message,
  }: {
    readonly outputModel?: Actions[A]["models"];
    readonly outputModelId?: string;
    readonly errorCode?: Actions[A]["errorCodes"];
    readonly errorMessage?: string;
    readonly message?: string;
  } = {},
): Promise<ActivityLog | ApolloError> {
  try {
    const activityLog = await ctx.prisma.activityLog.create({
      data: {
        action,
        inputModel,
        inputModelId,
        outputModel,
        outputModelId,
        errorCode,
        errorMessage,
        message,
        actorId: ctx.user.id,
        source: ctx.meta.source?.replace("@", "") || "Control",
      },
    });

    if (errorMessage || errorCode) {
      return new ApolloError(errorMessage || errorCode, errorCode);
    }

    return activityLog;
  } catch (error) {
    logger.error(
      "Unable to register activity log:",
      error,
      "data: ",
      JSON.stringify({
        action,
        inputModel,
        inputModelId,
        outputModel,
        outputModelId,
        errorCode,
        errorMessage,
        actorId: ctx.user?.id,
      }),
    );
  }

  return undefined;
}
