//const rateLimitProvider = process.env.RATELIMIT_PROVIDER!;
const rateLimitProvider = "upstash";

export async function rateLimit(
  userId: string,
  model: string,
  limit: number,
  duration: number
): Promise<boolean> {
  switch (rateLimitProvider.toLowerCase()) {
    case "upstash": {
      const limiter = await (
        await import("./upstash")
      ).ModelRateLimiter.create({
        userId,
        model,
        limit,
        duration,
      });
      //return (await limiter?.limit("chat"))?.success ?? false;
      const isLimitCheckOK = await limiter?.limit("chat")?.success ?? false;
      console.log("request may pass(true) or exceeded the limit(false)", isLimitCheckOK)
      return isLimitCheckOK
    }
    default:
      return true;
  }
}
