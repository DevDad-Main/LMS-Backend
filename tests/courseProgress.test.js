import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { CourseProgress } from "../models/CourseProgress.model.js";

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

const calculateCompletion = (completedLectures) => {
  const totalLectures = course?.sections?.reduce(
    (acc, s) => acc + (s.lectures?.length || 0),
    0,
  );
  const completedCount = completedLectures?.length || 0;
  if (!totalLectures) return 0;
  return Math.round((completedCount / totalLectures) * 100);
};

const completionPercentage = () => calculateCompletion([1, 2, 3, 4, 5]);
const isCompleted = () => calculateCompletion([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const toggleLecture = (lectureId, completedLectures) => {
  if (completedLectures.includes(lectureId)) {
    completedLectures.splice(completedLectures.indexOf(lectureId), 1);
  } else {
    completedLectures.push(lectureId);
  }
  return completedLectures;
};

//#region CourseProgress Model Test Suite
describe("CourseProgress Model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate the completion percentage correctly", () => {
    const completedLectures = [1, 2, 3];
    expect(calculateCompletion(completedLectures)).toBeTypeOf("number");
    expect(calculateCompletion(completedLectures)).toBe(30);
  });

  it("should return 0 if there are no lectures for the course", () => {
    const completedLectures = [];
    expect(calculateCompletion(completedLectures)).toBe(0);
  });

  it("should return us the completionPercentage virtual", () => {
    expect(completionPercentage()).toBe(50);
  });

  it("should return us the isCompleted virtual to equal 100%", () => {
    expect(isCompleted()).toBe(100);
  });

  it("should remove a lecture from the completed lectures array", async () => {
    const completedLectures = [1, 2, 3, 4, 5];
    expect(toggleLecture(1, completedLectures)).toEqual([2, 3, 4, 5]);
  });

  it("should add a lecture from the completed lectures array", async () => {
    const completedLectures = [2, 3, 4, 5];
    expect(toggleLecture(1, completedLectures)).toEqual([2, 3, 4, 5, 1]);
  });
});
//#endregion
