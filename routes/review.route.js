import Router from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  createReview,
  getReviews,
  deleteReview,
} from "../controllers/review.controller.js";

const router = Router();
router.use(isAuthenticated);

router
  .route("/course/review/:id")
  .get(getReviews)
  .post(createReview)
  .delete(deleteReview);

export default router;
