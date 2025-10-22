import { beforeEach, describe, expect, it } from "vitest";
import { Note } from "../../models/Note.model.js";
import request from "supertest";
import mongoose, { isValidObjectId } from "mongoose";

vi.mock("../../middleware/auth.middleware.js", () => ({
  isAuthenticated: (req, res, next) => {
    req.user = { _id: "mockUserId" }; // pretend a user is logged in
    next();
  },
  //NOTE: We need to mock the isInstructorAuthenticated middleware as well due to an error in our other routes that use it
  isInstructorAuthenticated: (req, res, next) => {
    req.instructor = { _id: "mockInstructorId" }; // pretend an instructor is logged in
    next();
  },
}));

import { app } from "../../app.js";

vi.mock("../../models/Note.model.js", () => ({
  Note: {
    find: vi.fn(),
    create: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

//#region Note Controller Test Suite
describe("Note Controller Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a list of notes associated with the :courseId", async () => {
    const courseId = new mongoose.Types.ObjectId();

    const notes = [{ title: "Test Note 1" }, { title: "Test Note 2" }];

    Note.find.mockReturnValue({
      sort: vi.fn().mockResolvedValue(notes),
    });

    const response = await request(app).get(`/api/v1/note/${courseId}/notes`);

    console.log(response.body.notes);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.notes).toHaveLength(2);
    expect(Note.find).toHaveBeenCalled();
  });

  it("should create a new note and return it back to the frontend", async () => {
    const courseId = new mongoose.Types.ObjectId();
    // Content is the only required field
    const note = {
      content: "Test Content",
      timeStamp: "00:00",
      course: courseId,
      user: "mockUserId",
    };

    Note.create.mockResolvedValue(note);

    const response = await request(app)
      .post(`/api/v1/note/${courseId}/add`)
      .send(note);

    console.log(response.body.note);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.note).toEqual({
      ...note,
      course: courseId.toString(),
    });
    expect(Note.create).toHaveBeenCalledWith({
      ...note,
      course: courseId.toString(),
    });
  });

  it("should delete a note by it's id", async () => {
    const courseId = new mongoose.Types.ObjectId();
    const noteId = new mongoose.Types.ObjectId();

    Note.findByIdAndDelete.mockResolvedValue(noteId);

    const response = await request(app).delete(
      `/api/v1/note/${courseId}/${noteId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Note deleted");
    expect(Note.findByIdAndDelete).toHaveBeenCalledWith(noteId.toString());
  });

  it("should return an error if courseId is invalid", async () => {
    const courseId = "invalidId";

    // Content is the only required field
    const note = {
      content: "Test Content",
      timeStamp: "00:00",
      course: courseId,
      user: "mockUserId",
    };

    Note.create.mockResolvedValue(note);

    const response = await request(app)
      .post(`/api/v1/note/${courseId}/add`)
      .send(note);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Course ID is invalid");
    expect(Note.create).not.toHaveBeenCalled();
  });
});
//#endregion
