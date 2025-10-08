import { Review } from "../models/Review.model.js";
import { CourseProgress } from "../models/CourseProgress.model.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";
import { isValidObjectId } from "mongoose";

//#region Get All Reviews For Course
export const getReviews = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) throw new AppError("Invalid ObjectId", 400);

  const reviews = await Review.find({ course: id })
    .populate("user")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, reviews });
});
//#endregion;

//#region Create Review For Course
export const createReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!isValidObjectId(id)) throw new AppError("Invalid ObjectId", 400);

  if (!rating || !comment) throw new AppError("Missing required fields", 400);

  const review = await Review.create({
    user: req.user?._id,
    course: id,
    rating: parseInt(rating),
    comment,
  });

  if (!review) throw new AppError("Failed to create review", 500);

  const courseProgress = await CourseProgress.findOneAndUpdate(
    { course: id, user: req.user?._id },
    { $set: { hasReview: true } },
  );

  if (!courseProgress) {
    throw new AppError("Failed to update course progress", 500);
  }

  return res.status(201).json({ success: true, review });
});
//#endregion;

//#region Delete Review For Course
export const deleteReview = catchAsync(async (req, res) => {});
//#endregion
