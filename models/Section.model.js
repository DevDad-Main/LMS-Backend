import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxLength: [100, "Section title cannot exceed 100 characters"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
  },
  { timestamps: true },
);

export const Section = mongoose.model("Section", sectionSchema);
