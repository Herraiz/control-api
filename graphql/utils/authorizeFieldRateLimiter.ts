import { RateLimiterMemory } from "rate-limiter-flexible";
import { ApolloError } from "apollo-server-micro";
import { Context } from "@/graphql/context";

// Max 3 reqs per 5 seconds.
const rateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 5,
});

export default function authorizeFieldRateLimiter(
  any: unknown,
  args: unknown,
  ctx: Context,
): Promise<boolean> {
  return rateLimiter
    .consume(ctx.user?.id || ctx.meta.remoteAddress, 1)
    .then(() => true)
    .catch(() => {
      throw new ApolloError("Rate limit exceeded", "RATE_LIMIT_EXCEEDED");
    });
}
