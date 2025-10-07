import Router from "express";
import {
  createReview,
  getReviews,
  deleteReview,
} from "../controllers/review.controller.js";

const router = Router();

router
  .route("/course/review/:id")
  .get(getReviews)
  .post(createReview)
  .delete(deleteReview);

export default router;
