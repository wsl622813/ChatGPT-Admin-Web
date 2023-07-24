import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Duration, ms } from "@caw/types";

export const defaultRedis = new Redis({
  url: process.env.REDIS_URL ?? "",
  token: process.env.REDIS_TOKEN ?? "",
});

export class ModelRateLimiter extends Ratelimit {
  /**
   * construct a new model rate limiter by email and model provided
   * @returns null if the plan or model does not exist
   */
  static async create({
    userId,
    model,
    limitnum,
    duration /* unit is second */,
    redis = defaultRedis,
  }: CreateModelRateLimiterParams): Promise<ModelRateLimiter | null> {
    return new ModelRateLimiter({
      redis,
      userId,
      model,
      limitnum,
      window: `${duration}s` as Duration,
    });
  }

  #userId: string;
  #windowSize: number;
  #redis: Redis;
  #limitnum: number;
  #prefix: string;

  private constructor({
    redis = defaultRedis,
    userId,
    model,
    limitnum,
    window,
  }: ConstructModelRateLimiterParams) {
    const prefix = `ratelimit:${userId}:${model}`;

    super({
      redis,
      prefix,
      limiter: Ratelimit.slidingWindow(limitnum, window),
    });

    this.#userId = userId;
    this.#windowSize = ms(window);
    this.#redis = redis;
    this.#limitnum = limitnum;
    this.#prefix = prefix;
  }

  clear() {
    return this.#redis.del(`${this.#prefix}:${this.#userId}:*`);
  }
}

export type CreateModelRateLimiterParams = {
  userId: string;
  model: string;
  limitnum: number;
  duration: number;
  redis?: Redis;
};

type ConstructModelRateLimiterParams = {
  redis?: Redis;
  userId: string;
  model: string;
  limitnum: number;
  window: Duration;
};
