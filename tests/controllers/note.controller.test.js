import { beforeEach, describe, expect, it } from "vitest";
import { Note } from "../../models/Note.model.js";
import { User } from "../../models/User.model.js";
import request from "supertest";
import { app } from "../../app.js";
import mongoose, { isValidObjectId } from "mongoose";

vi.mock("../../models/Note.model.js", () => ({
  Note: {
    find: vi.fn(),
  },
}));

//#region Note Controller Test Suite
describe("GET /api/v1/note/:courseId/notes", () => {
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
});
//#endregion
