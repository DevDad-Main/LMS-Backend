import { describe, expect, it } from "vitest";
import { validate as uuidValidate } from "uuid";
import { Instructor } from "../models/Instructor.model.js";

//#region Instructor model Test Suite
describe("Instructor Model", () => {
  it("should init the folderId before saving - only used for google Oauth login", async () => {
    const instructor = new Instructor({
      name: "Test Instructor",
      email: "test@test.com",
      password: "password123",
    });
    await instructor.save();

    console.log("Instructor Folder: ", instructor.folderId);

    expect(instructor.folderId).not.toBeUndefined();
    expect(uuidValidate(instructor.folderId)).toBe(true);
  });
});
//#endregion
