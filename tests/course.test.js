import { describe, expect, it } from "vitest";
import { Course } from "../models/Course.model.js";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import mongoose from "mongoose";
import { app } from "./app.js";
import request from "supertest";

//#region Course model Test Suite
describe("Course Model", () => {
  it("should init the folderId before saving", async () => {
    const user = {
      _id: new mongoose.Types.ObjectId(),
    };
    const section = {
      _id: new mongoose.Types.ObjectId(),
    };
    const instructor = {
      _id: new mongoose.Types.ObjectId(),
    };

    const course = new Course({
      title: "Test Course",
      subtitle: "Test Subtitle",
      description: "Test Description",
      requirements: ["HTML"],
      tags: ["HTML"],
      languages: ["English"],
      category: "Web Development",
      level: "Beginner",
      price: 10,
      instructor: instructor._id,
      courseOwner: user._id,
    });
    await course.save();

    console.log("Course Folder: ", course.folderId);

    expect(course.folderId).not.toBeUndefined();
    expect(uuidValidate(course.folderId)).toBe(true);
  });

  it("should fail if required fields are missing", async () => {
    const course = new Course({});
    await expect(course.save()).rejects.toThrowError();
  });

  it("should fail if the value passed into limitArray is > than the field value", async () => {
    const userId = new mongoose.Types.ObjectId();
    const instructorId = new mongoose.Types.ObjectId();

    const course = new Course({
      title: "Test Course",
      subtitle: "Test Subtitle",
      description: "Test Description",
      learnableSkills: ["1", "2", "3", "4", "5", "6", "7"], // >6 items
      requirements: ["HTML"],
      tags: ["HTML"],
      languages: ["English"],
      category: "Web Development",
      level: "Beginner",
      price: 10,
      instructor: instructorId,
      courseOwner: userId,
    });

    await expect(course.save()).rejects.toThrowError(
      /Course validation failed: learnableSkills: Cannot have more than 6 items/,
    );
  });

  it("should reject course creation via API if learnableSkills > 6", async () => {
    const res = await request(app)
      .post("/api/v1/course/add-course")
      .send({
        title: "Test Course",
        learnableSkills: ["1", "2", "3", "4", "5", "6", "7"],
        instructor: "someId",
        courseOwner: "someId",
        category: "Web Development",
        price: 10,
        languages: ["English"],
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Cannot have more than 6/);
  });
});
//#endregion
