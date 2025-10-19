import { describe, expect, it } from "vitest";
import { Course } from "../models/Course.model.js";
import "./setup/mongodb.js";
import { v7 as uuidv7, validate as uuidValidate } from "uuid";
import mongoose from "mongoose";

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
      learnableSkills: ["HTML", "CSS", "JavaScript"],
      requirements: ["HTML", "CSS", "JavaScript"],
      tags: ["HTML", "CSS", "JavaScript"],
      languages: ["English", "Spanish"],
      category: "Web Development",
      level: "Beginner",
      price: 10,
      thumbnail: "https://example.com/thumbnail.png",
      enrolledStudents: [user._id],
      sections: [section._id],
      instructor: instructor._id,
      isPublished: true,
      totalDuration: 10,
      totalLectures: 10,
      folderId: "",
      courseOwner: user._id,
      lastUpdated: Date.now(),
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
});
//#endregion
