//const rateLimitProvider = process.env.RATELIMIT_PROVIDER!;
const rateLimitProvider = "upstash";

export async function rateLimit(
  userId: string,
  model: string,
  limitnum: number,
  duration: number
): Promise<boolean> {
  switch (rateLimitProvider.toLowerCase()) {
    case "upstash": {
      const limiter = await (
        await import("./upstash")
      ).ModelRateLimiter.create({
        userId,
        model,
        limitnum,
        duration,
      });
      //return (await limiter?.limit("chat"))?.success ?? false;
      if (limiter != null)
      {
        const { success, limit, remaining } = await limiter.limit("chat");
        console.log("request may pass(true) or exceeded the limit(false)", success)
        console.log("limit:", limit)
        console.log("remaining:)", remaining)
        return success
      }


    }
    default:
      return true;
  }
}
