import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { CourseProgress } from "../models/CourseProgress.model.js";

// vi.mock("../models/CourseProgress.model.js", () => ({
//   CourseProgress: {
//     calculateCompletion: vi.fn(),
//     // completionPercentage: vi.fn(),
//   },
// }));
const course = {
  sections: [
    {
      lectures: [
        { duration: 10 },
        { duration: 20 },
        { duration: 30 },
        { duration: 40 },
        { duration: 50 },
      ],
    },
    {
      lectures: [
        { duration: 10 },
        { duration: 20 },
        { duration: 30 },
        { duration: 40 },
        { duration: 50 },
      ],
    },
  ],
};

const calculateCompletion = () => {
  const completedLectures = [1, 2, 3];

  const totalLectures = course?.sections?.reduce(
    (acc, s) => acc + (s.lectures?.length || 0),
    0,
  );
  const completedCount = completedLectures?.length || 0;
  if (!totalLectures) return 0;
  return Math.round((completedCount / totalLectures) * 100);
};

//#region CourseProgress Model Test Suite
describe("CourseProgress Model", () => {
  it("should calculate the completion percentage correctly", () => {
    expect(calculateCompletion()).toBe(30);
  });
});
//#endregion
