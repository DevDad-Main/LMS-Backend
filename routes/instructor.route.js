import express from "express";
import { isInstructorAuthenticated } from "../middleware/auth.middleware.js";
import { upload } from "../utils/multer.js";
import {
  validateSignup,
  validateSignin,
  validatePasswordChange,
} from "../middleware/validation.middleware.js";
import {
  createInstructorAccountWithGoogle,
  authenticateInstructor,
  getInstructorsCourses,
  signOutInstructor,
} from "../controllers/instructor.controller.js";

const router = express.Router();

router.get(
  "/instructor-authenticated",
  isInstructorAuthenticated,
  authenticateInstructor,
);
router.get("/signout", signOutInstructor);
router.get("/courses", isInstructorAuthenticated, getInstructorsCourses);

router.post("/google-login", createInstructorAccountWithGoogle);

export default router;
