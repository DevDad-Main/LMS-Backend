import { catchAsync } from "../middleware/error.middleware.js";
import { Note } from "../models/Note.model.js";
import { AppError } from "../middleware/error.middleware.js";

//#region Create Note
export const createNote = catchAsync(async (req, res) => {
  const { content, timeStamp } = req.body;

  if (!content || !timeStamp)
    throw new AppError("Content and Time Stamp are required", 400);

  const note = await Note.create({
    content,
    timeStamp,
    user: req.user._id,
  });

  if (!note) return res.status(400).json({ message: "Note not created" });

  return res
    .status(200)
    .json({ success: true, note, message: "Note Created Successfully" });
});
//#endregion

//#region Get Notes
export const getNotes = catchAsync(async (req, res) => {});
//#endregion

//#region Get Note
export const getNote = catchAsync(async (req, res) => {});
//#endregion

//#region Update Note
export const updateNote = catchAsync(async (req, res) => {});
//#endregion

//#region Delete Note
export const deleteNote = catchAsync(async (req, res) => {});
//#endregion
