import connectDB from "./database/db.js";
import { app } from "./app.js";
import "dotenv/config";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { cloudinaryImageUploaderQueue } from "./queues/cloudinaryImageQueue.js";

//#region Constants
const PORT = process.env.PORT || 3000;
//#endregion

//#region Bull Board
// NOTE: Create a server adapter for Bull Board - similiar to our test project
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// NOTE: Attach the queues to the dashboard
createBullBoard({
  // queues: [new BullMQAdapter(cloudinaryImageQueue)],
  queues: [new BullMQAdapter(cloudinaryImageUploaderQueue)],
  serverAdapter,
});

// NOTE: Mount the dashboard route
app.use("/admin/queues", serverAdapter.getRouter());
//#endregion

//#region 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});
//#endregion;

//#region DB Connection
await connectDB();

app.listen(PORT, () => {
  console.log(`Server is listening on: http://localhost:${PORT}`);
  console.log(`Bull Board available at: http://localhost:${PORT}/admin/queues`);
});
//#endregion
