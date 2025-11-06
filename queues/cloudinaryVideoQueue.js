import { Queue, Worker, QueueEvents } from "bullmq";
import { connection } from "../configs/bullmq.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";

const cloudinaryVideoWorker = new Worker(
  "cloudinary-upload-video",
  async (job) => {
    job.log("Processing Video Upload..", job.name);

    let { buffer, folderId } = job.data;

    if (buffer && buffer.data) {
      buffer = Buffer.from(buffer.data);
    }
    job.log("Uploading Video to cloudinary...");
    const result = await uploadBufferToCloudinary(buffer, folderId, "video");
  },
);
