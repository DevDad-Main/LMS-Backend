import { Queue, Worker, QueueEvents } from "bullmq";
import { connection } from "../configs/bullmq.js";

const CLOUDINARY_IMAGE_QUEUE = "cloudinaryImageQueue";

const cloudinaryImageWorker = new Worker(
  CLOUDINARY_IMAGE_QUEUE,
  async (job) => {
    await job.log("Processing Cloudinary Image Job...", job.name);

    try {
    } catch (error) {
      console.log("Error details: ", error);
      await job.log(error.message, job.name);
    }
  },
  { connection },
);

export const cloudinaryImageQueue = new Queue(CLOUDINARY_IMAGE_QUEUE, {
  connection,
});

const cloudinaryImageQueueEvents = new QueueEvents(CLOUDINARY_IMAGE_QUEUE, {
  connection,
});

cloudinaryImageQueueEvents.on("completed", ({ jobId }) => {
  console.log(`Cloudinary Image Job ${jobId} completed.`);
});

cloudinaryImageQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`Cloudinary Image Job ${jobId} failed - ${failedReason}.`);
});

cloudinaryImageQueueEvents.on("error", (err) => {
  // log the error
  console.error(err);
});
