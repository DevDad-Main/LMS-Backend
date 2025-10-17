import { describe, it, expect, vi, beforeEach } from "vitest";
import generateUserToken from "../utils/generateToken.js";
import { User } from "../models/User.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { AppError } from "../middleware/error.middleware.js";

// Set a mock JWT secret
process.env.JWT_SECRET = "testsecret";

vi.mock("../models/User.model.js", () => ({
  User: {
    findById: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe("generateUserToken()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a token for a valid user", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = { _id: userId };

    //NOTE: Mock Resolved is used for async -> we tell this vi.fn to return a promise
    User.findById.mockResolvedValue(mockUser);
    //NOTE: Mock Return is used for sync code
    jwt.sign.mockReturnValue("token");

    const result = await generateUserToken(userId);

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(jwt.sign).toHaveBeenCalledWith(
      { _id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    expect(result).toEqual({ token: "token" });
  });

  it("should throw AppError if userId is invalid", async () => {
    const invalidUserId = "invalidUserId";

    await expect(generateUserToken(invalidUserId)).rejects.toThrow(AppError);
  });

  it("should throw AppError if userId is an empty value", async () => {
    const invalidUserId = "  ";

    await expect(generateUserToken(invalidUserId)).rejects.toThrow(AppError);
  });

  it("should throw AppError if userId is undefined", async () => {
    const invalidUserId = undefined;

    await expect(generateUserToken(invalidUserId)).rejects.toThrow(AppError);
  });
});
