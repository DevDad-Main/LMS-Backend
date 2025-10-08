import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be greater than 1"],
      max: [5, "Rating must be less than 5"],
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const Review = mongoose.model("Review", ReviewSchema);
