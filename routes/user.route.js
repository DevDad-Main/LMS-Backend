import express from "express";
import {
  addCourseToCart,
  authenticateUser,
  changeUserPassword,
  deleteCourseFromCart,
  getUsersDashboard,
  createUserAccount,
  createUserAccountWithGoogle,
  deleteUserAccount,
  getEnrolledCourses,
  signOutUser,
  updateUserProfile,
  getUsersCart,
  getUsersCompletedCourses,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { upload } from "../utils/multer.js";
import {
  validateSignup,
  validateSignin,
  validatePasswordChange,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Auth routes
router.get("/signout", signOutUser);
router.get("/user-authenticated", isAuthenticated, authenticateUser);
router.get("/enrolled-courses", isAuthenticated, getEnrolledCourses);
router.get("/cart/get", isAuthenticated, getUsersCart);
router.get(
  "/dashboard",
  isAuthenticated,
  getUsersDashboard,
  getUsersCompletedCourses,
);

router.post("/signup", validateSignup, createUserAccount);
router.post("/google-login", createUserAccountWithGoogle);
router.post("/signin", validateSignin, authenticateUser);
router.post("/cart/add", isAuthenticated, addCourseToCart);

router.patch(
  "/profile",
  isAuthenticated,
  upload.single("avatar"),
  updateUserProfile,
);

// Password management
router.patch(
  "/change-password",
  isAuthenticated,
  validatePasswordChange,
  changeUserPassword,
);

// Account management
router.delete("/account", isAuthenticated, deleteUserAccount);
router.delete("/cart/delete/:id", isAuthenticated, deleteCourseFromCart);

export default router;
