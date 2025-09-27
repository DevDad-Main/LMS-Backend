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
  updateInstructorDetails,
  authenticateInstructor,
  getInstructorsCourses,
  signOutInstructor,
  getInstructorProfile,
  instructorRegisterWithForm,
} from "../controllers/instructor.controller.js";

const router = express.Router();

router
  .route("/profile")
  .get(isInstructorAuthenticated, getInstructorProfile)
  .post(
    upload.single("avatar"),
    isInstructorAuthenticated,
    updateInstructorDetails,
  );

router.get(
  "/instructor-authenticated",
  isInstructorAuthenticated,
  authenticateInstructor,
);
router.get("/signout", signOutInstructor);
router.get("/courses", isInstructorAuthenticated, getInstructorsCourses);

router.post("/register", upload.single("avatar"), instructorRegisterWithForm);
router.post("/google-login", createInstructorAccountWithGoogle);

export default router;
