import { Queue, Worker, QueueEvents } from "bullmq";
import { connection } from "../configs/bullmq.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

const cloudinaryImageWorker = new Worker(
  "cloudinary-upload-image",
  async (job) => {
    job.log("Processing Cloudinary Upload Job...", job.name);
    let { buffer, folderId } = job.data;

    if (buffer && buffer.data) {
      buffer = Buffer.from(buffer.data);
    }

    job.log("Uploading Image to cloudinary...");
    const result = await uploadBufferToCloudinary(buffer, folderId);
    job.log("Uploaded Image to cloudinary...");

    // NOTE: Now we can return the result and access it in our controller
    return { secure_url: result.secure_url, public_id: result.public_id };
  },
  { connection },
);

export const cloudinaryImageUploaderQueue = new Queue(
  "cloudinary-upload-image",
  {
    connection,
  },
);

export const cloudinaryImageQueueEvents = new QueueEvents(
  "cloudinary-upload-image",
  {
    connection,
  },
);

cloudinaryImageQueueEvents.on("completed", ({ jobId }) => {
  console.log(`Cloudinary Upload Job ${jobId} completed.`);
});

cloudinaryImageQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`Cloudinary Upload Job ${jobId} failed - ${failedReason}.`);
});

cloudinaryImageQueueEvents.on("error", (err) => {
  // log the error
  console.error(err);
});
