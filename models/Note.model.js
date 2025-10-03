import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    timeStamp: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  },
  {
    timestamps: true,
  },
);

export const Note = mongoose.model("Note", noteSchema);
