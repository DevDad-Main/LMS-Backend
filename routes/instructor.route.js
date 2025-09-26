import express from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { upload } from "../utils/multer.js";
import {
  validateSignup,
  validateSignin,
  validatePasswordChange,
} from "../middleware/validation.middleware.js";
import { createInstructorAccountWithGoogle } from "../controllers/instructor.controller.js";

const router = express.Router();

router.post("/google-login", createInstructorAccountWithGoogle);

export default router;
