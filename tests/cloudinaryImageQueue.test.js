import { beforeAll, describe, expect, it, afterAll } from "vitest";
import IORedis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";

const connection = new IORedis({ maxRetriesPerRequest: null });

let testQueue;
let testWorker;
let testQueueEvents;

beforeAll(() => {
  testQueue = new Queue("cloudinary-upload-image-test", { connection });

  testWorker = new Worker(
    "cloudinary-upload-image-test",
    async (job) => {
      console.log("Mocking Cloudinary Upload...");
      const { buffer, folderId } = job.data;
      // mock cloudinary upload

      console.log("Successfully Mocked Cloudinary Upload...");
      return {
        secure_url: `https://example.com/${folderId}/image.png`,
        public_id: "mock-id",
      };
    },
    { connection },
  );

  testQueueEvents = new QueueEvents("cloudinary-upload-image-test", {
    connection,
  });
});

afterAll(async () => {
  if (testWorker) await testWorker.close();
  if (testQueue) await testQueue.close();
  if (testQueueEvents) await testQueueEvents.close();
  await connection.quit();
});

describe("Cloudinary Image Upload Queue", () => {
  it(
    "should add a new job to the queue and worker uploads image to cloudinary",
    { timeout: 5000 },
    async () => {
      const buffer = Buffer.from("test");
      const folderId = "test-folder";

      const job = await testQueue.add("upload-new-image", {
        buffer,
        folderId,
      });

      const result = await job.waitUntilFinished(testQueueEvents);

      expect(result).toBeDefined();
      expect(result.secure_url).toBe(
        "https://example.com/test-folder/image.png",
      );
      expect(result.public_id).toBe("mock-id");
    },
  );
});
