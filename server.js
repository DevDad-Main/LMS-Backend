import connectDB from "./database/db.js";
import { app } from "./app.js";
import "dotenv/config";

//#region Constants
const PORT = process.env.PORT || 3000;
//#endregion

//#region DB Connection
await connectDB();

app.listen(PORT, () => {
  `Server is listening on: ${PORT}`;
});
//#endregion
