import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { User } from "../models/User.model.js";

//#region User model Test Suite
describe("User Model", () => {
  // NOTE: Redundant unit test as we don't use the pre save hook anymore
  // it("should hash the password before saving", async () => {
  //   const user = new User({
  //     name: "John Doe",
  //     email: "johndoe@example.com",
  //     password: "password123",
  //   });
  //   await user.save();
  //
  //   expect(user.password).not.toBe("password123");
  //
  //   const isMatch = await bcrypt.compare("password123", user.password);
  //   expect(isMatch).toBe(true);
  // });

  it("should fail if required fields are missing", async () => {
    const user = new User({});
    await expect(user.save()).rejects.toThrowError();
  });

  it("should compare the passwords correctly", async () => {
    const user = new User({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
    });
    await user.save();

    const isMatch = await user.comparePassword("password123");
    expect(isMatch).toEqual(true);
  });
});
//#endregion
