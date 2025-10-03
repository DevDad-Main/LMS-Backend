import { catchAsync } from "../middleware/error.middleware.js";
import { Note } from "../models/Note.model.js";
import { AppError } from "../middleware/error.middleware.js";
import { isValidObjectId } from "mongoose";

//#region Create Note
export const createNote = catchAsync(async (req, res) => {
  const { content, timeStamp } = req.body;
  const { courseId } = req.params;

  if (!isValidObjectId(courseId))
    throw new AppError("Course ID is invalid", 400);

  if (!content || !timeStamp)
    throw new AppError("Content and Time Stamp are required", 400);

  const note = await Note.create({
    content,
    timeStamp,
    user: req.user._id,
    course: courseId,
  });

  if (!note) return res.status(400).json({ message: "Note not created" });

  return res
    .status(200)
    .json({ success: true, note, message: "Note Created Successfully" });
});
//#endregion

//#region Get Notes
export const getNotes = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  if (!isValidObjectId(courseId))
    throw new AppError("Course ID is invalid", 400);

  const notes = await Note.find({ course: courseId });

  if (!notes) throw new AppError("No notes found for this course", 404);

  console.log(notes);

  return res.status(200).json({ success: true, notes });
});
//#endregion

//#region Get Note
export const getNote = catchAsync(async (req, res) => {});
//#endregion

//#region Update Note
export const updateNote = catchAsync(async (req, res) => {});
//#endregion

//#region Delete Note
export const deleteNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;

  if (!isValidObjectId(noteId)) throw new AppError("Note ID is invalid", 400);

  const note = await Note.findByIdAndDelete(noteId);

  if (!note) throw new AppError("Note not found", 404);

  return res.status(200).json({ success: true, message: "Note deleted" });
});
//#endregion
