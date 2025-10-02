import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  timeStamp: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export const Note = mongoose.model("Note", noteSchema);
