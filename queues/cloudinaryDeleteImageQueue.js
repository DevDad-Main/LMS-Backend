import { Queue, Worker, QueueEvents } from "bullmq";
import { connection } from "../configs/bullmq.js";
import { deleteImageFromCloudinary } from "../utils/cloudinary.js";

const cloudinaryImageWorker = new Worker(
  "cloudinary-delete-image",
  async (job) => {
    job.log("Processing Cloudinary Deletion Job...", job.name);
    const { oldPublicId } = job.data;

    job.log("Deleting Image From cloudinary...");
    await deleteImageFromCloudinary(oldPublicId);
  },
  { connection },
);

export const cloudinaryDeleteImageQueue = new Queue("cloudinary-delete-image", {
  connection,
});

const cloudinaryDeleteImageQueueEvents = new QueueEvents(
  "cloudinary-delete-image",
  {
    connection,
  },
);

cloudinaryDeleteImageQueueEvents.on("completed", ({ jobId }) => {
  console.log(`Cloudinary Deletion Job ${jobId} completed.`);
});

cloudinaryDeleteImageQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`Cloudinary Deletion Job ${jobId} failed - ${failedReason}.`);
});

cloudinaryDeleteImageQueueEvents.on("error", (err) => {
  // log the error
  console.error(err);
});
