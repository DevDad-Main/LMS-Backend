import { it, describe, expect, beforeEach, vi } from "vitest";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

process.env.CLOUDINARY_CLOUD_NAME = "demo";
process.env.CLOUDINARY_API_KEY = "123456789012345678901234";
process.env.CLOUDINARY_API_SECRET = "abcdefghijklmnopqrstuvwxyz";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

describe("uploadBufferToCloudinary()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve if we successfully pipe our stream with our buffered data file to Cloudinary", async () => {
    const mockResult = {
      url: "https://res.cloudinary.com/demo/image/upload/v1674083523/test.jpg",
    };
    const mockStream = { write: vi.fn(), end: vi.fn() };

    cloudinary.uploader.upload_stream.mockImplementation((_, cb) => {
      // Simulate our successful upload
      cb(null, mockResult);
      return mockStream;
    });

    const buffer = Buffer.from("test-image");
    const result = await uploadBufferToCloudinary(buffer, "test-folder");

    expect(result).toEqual(mockResult);
  });

  it("should reject if Cloudinary upload fails", async () => {
    const mockError = new Error("Cloudinary Upload Error");
    const mockStream = { write: vi.fn(), end: vi.fn() };

    cloudinary.uploader.upload_stream.mockImplementation((_, cb) => {
      // Simulate our successful upload
      cb(mockError, null);
      return mockStream;
    });

    const buffer = Buffer.from("test-image");
    //NOTE: Handle the expect like this as if we do like above ironically our test fails because the promise gets unwrapped before we even get to the expectation. So we await it and do the expect check in one go when we unwrap it.
    await expect(
      uploadBufferToCloudinary(buffer, "test-folder"),
    ).rejects.toThrow("Cloudinary Upload Error");
  });

  it("should reject if the buffer is missing", async () => {
    await expect(
      uploadBufferToCloudinary(undefined, "test-folder"),
    ).rejects.toThrow("Missing buffer data");
  });

  it("should reject if the folderId is missing", async () => {
    const buffer = Buffer.from("test-image");
    console.log(buffer);

    await expect(uploadBufferToCloudinary(buffer, undefined)).rejects.toThrow(
      "Missing folderId",
    );
  });
});
