import Review from "../models/Review.model.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";
import { isValidObjectId } from "mongoose";

export const getReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new AppError("Invalid ObjectId", 400);

  const reviews = await Review.find({ course: id }).populate("user");

  return res.status(200).json({ success: true, reviews });
});

export const createReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!isValidObjectId(id)) throw new AppError("Invalid ObjectId", 400);

  if (!rating || !comment) throw new AppError("Missing required fields", 400);

  const review = await Review.create({
    user: req.user._id,
    course: id,
    rating: parseInt(rating),
    comment,
  });

  if (!review) throw new AppError("Failed to create review", 500);

  return res.status(201).json({ success: true, review });
});

export const deleteReview = catchAsync(async (req, res) => {});
