import "dotenv/config";

//#region Redis Connection
export const connection = {
  host:
    process.env.NODE_ENV === "production"
      ? process.env.REDIS_HOST
      : "127.0.0.1",
  port: process.env.NODE_ENV === "production" ? process.env.REDIS_PORT : 6379,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
};
//#endregion
