import { describe, expect, it } from "vitest";
import { Lecture } from "../models/Lecture.model.js";

//#region Lecture model Test Suite
describe("Lecture Model", () => {
  it("should format the duration before saving - pre hook", async () => {
    const lecture = new Lecture({
      title: "Test Lecture",
      duration: 10.12313,
    });

    console.log("Duration Before: ", lecture.duration);

    await lecture.save();

    console.log("Duration After: ", lecture.duration);
    expect(lecture.duration).toBe(10.12);
  });
});
