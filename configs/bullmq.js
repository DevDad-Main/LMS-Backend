import "dotenv/config";

//#region Redis Connection
export const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};
//#endregion
