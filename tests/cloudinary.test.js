import { it, describe, expect, beforeEach, vi } from "vitest";
import {
  uploadBufferToCloudinary,
  getPublicIdFromUrl,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
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
      destroy: vi.fn(),
    },
  },
}));

//#region uploadBufferToCloudinary()
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
    // console.log(buffer);

    await expect(uploadBufferToCloudinary(buffer, undefined)).rejects.toThrow(
      "Missing folderId",
    );
  });
});
//#endregion

//#region getPublicIdFromUrl()
describe("getPublicIdFromUrl()", () => {
  it("should return the correct publicId for a valid URL", () => {
    const url =
      "https://res.cloudinary.com/dpb0u6lxn/image/upload/v1758998514/LearnHub/68d6f0b59a5bc7cb751b8c9b/eyuhpusrs5tdakgpusgi.svg";
    const publicId = getPublicIdFromUrl(url);
    expect(publicId).toEqual(
      "LearnHub/68d6f0b59a5bc7cb751b8c9b/eyuhpusrs5tdakgpusgi",
    );
    // expect(publicId).toEqual("LearnHub/test");
  });

  it("should throw an error if the URL is not a string", () => {
    const url = 123;

    expect(() => getPublicIdFromUrl(url)).toThrowError("Invalid URL");
  });

  it("should throw an error if the URL is undefined", () => {
    expect(() => getPublicIdFromUrl(undefined)).toThrowError("Invalid URL");
  });

  it("should throw an error if the URL is undefined", () => {
    const url =
      "https://res.cloudinary.com/dpb0u6lxn/image/upload/v1758998514/LearnHub/68d6f0b59a5bc7cb751b8c9b/eyuhpusrs5tdakgpusgi.svg";

    const urlWithValidContents = ["cloudinary", "LearnHub"];

    //NOTE: We can't use the .toContain() method as it will only check if the string contains the substring and not if it is the entire string -> Couple ways below to handle this

    // urlWithValidContents.forEach((substring) => {
    //   expect(url).toContain(substring);
    // });

    expect(urlWithValidContents.every((sub) => url.includes(sub))).toBe(true);
  });
});
//#endregion

//#region deleteImageFromCloudinary()
describe("deleteImageFromCloudinary()", () => {
  it("should resolve if we successfully delete the image from Cloudinary", async () => {
    const mockResult = {
      result: "ok",
    };

    cloudinary.uploader.destroy.mockResolvedValue(mockResult);

    const publicId = "test-public-id";
    const resourceType = "image";

    const result = await deleteImageFromCloudinary(publicId, resourceType);

    expect(result).toEqual(mockResult);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
      resource_type: resourceType,
    });
  });

  it("should reject if Cloudinary deletion fails", async () => {
    const mockError = new Error("Cloudinary Deletion Error");

    cloudinary.uploader.destroy.mockRejectedValue(mockError);

    const publicId = "test-public-id";
    const resourceType = "image";

    await expect(
      deleteImageFromCloudinary(publicId, resourceType),
    ).rejects.toThrow("Cloudinary Deletion Error");

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
      resource_type: resourceType,
    });
  });

  it("should throw an error if the publicId is undefined", async () => {
    expect(() => deleteImageFromCloudinary(undefined)).toThrowError(
      "Invalid publicId",
    );
  });

  it("should throw an error if the publicId is not a string", () => {
    const publicId = 123;

    expect(() => deleteImageFromCloudinary(publicId)).toThrowError(
      "Invalid publicId",
    );
  });
});
//#endregion
