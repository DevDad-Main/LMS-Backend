import { User } from "../models/User.model.js";
import { CourseProgress } from "../models/CourseProgress.model.js";
import bcrypt from "bcryptjs";
import generateUserToken from "../utils/generateToken.js";
import {} from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { Course } from "../models/Course.model.js";
import crypto from "crypto";
import mongoose, { isValidObjectId } from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { v7 as uuidv7 } from "uuid";

//#region CONSTANTs
const SALT_ROUNDS = 12;
const options = {
  httpOnly: true, // keep false for localhost socket io to work
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//#endregion

/**
 * Create a new user account via google
 * @route POST /api/v1/users/google-login
 */
//#region Create User Account With Google
// export const createUserAccountWithGoogle = catchAsync(async (req, res) => {
//   const { credential } = req.body;
//
//   if (!req.body.credential) {
//     throw new AppError("Google credential is required", 400);
//   }
//
//   //Verify Credentials
//   const ticket = await client.verifyIdToken({
//     idToken: credential,
//     audience: process.env.GOOGLE_CLIENT_ID,
//   });
//
//   const payload = ticket.getPayload();
//   const { email, name } = payload;
//   // Generate a random password for the user as google users dont need one
//   const password = uuidv7();
//   const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
//
//   let user = await User.findOne({ email });
//
//   if (!user) {
//     user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       authProvider: "google",
//     });
//   }
//
//
//   const { token } = await generateUserToken(user._id);
//
//   return res
//     .status(201)
//     .cookie("token", token, options)
//     .json({
//       success: true,
//       token,
//       user: {
//         name: user.name,
//         email: user.email,
//         authProvider: user.authProvider,
//       },
//       message: "Google Login Successful",
//     });
// });

export const createUserAccountWithGoogle = catchAsync(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new AppError("Google credential is required", 400);
  }

  // Verify Google credentials
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name } = payload;

  // Generate a random password for the user
  const password = uuidv7();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "google",
    });
  }

  // Real course ID
  const courseId = new mongoose.Types.ObjectId("68d3ce2d7c3efd1997a1d844");

  // Find the course
  const course = await Course.findById(courseId).populate({
    path: "sections",
    select: "title _id",
    populate: {
      path: "lectures",
      select: "title videoUrl isCompleted _id",
      model: "Lecture", // Explicitly specify the model name
    },
  });

  console.log(course);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Initialize lectureProgress array by flattening lectures from all sections
  const lectureProgress = course.sections.flatMap((section) =>
    section.lectures.map((lecture) => ({
      lecture: lecture._id,
      isCompleted: false,
      watchTime: 0,
      lastWatched: new Date(),
    })),
  );

  // Check if lectureProgress is populated
  if (!lectureProgress.length) {
    console.warn("No lectures found in the course sections");
  }

  // Create CourseProgress with lectureProgress
  const courseProgress = await CourseProgress.create({
    user: user._id,
    course: course._id,
    lectureProgress,
  });

  // Generate JWT token
  const { token } = await generateUserToken(user._id);

  return res
    .status(201)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
      message: "Google Login Successful",
    });
}); //#endregion

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
//#region Create User With Non Google Signup
export const createUserAccount = catchAsync(async (req, res) => {
  // TODO: Implement create user account functionality
});
//#endregion

/**
 * Authenticate user and get token to keep user logged in
 * @route POST /api/v1/users/signin
 */
//#region User Authentication
export const authenticateUser = catchAsync(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new AppError("Invalid User Id", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User Not Found", 400);
    res.json({ success: false, message: "User not found" });
  }

  return res.status(200).json({
    success: true,
    user,
    message: "User Passed Authentication Check",
  });
});
//#endregion

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
//#region User Sign out
export const signOutUser = catchAsync(async (_, res) => {
  return res
    .status(200)
    .clearCookie("token", options)
    .json({ success: true, message: "User Signed Out" });
});
//#endregion

//#region Users Enrolled Courses
export const getEnrolledCourses = catchAsync(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new AppError("Invalid User Id", 404);
  }

  //NOTE: Testing purposes only limit it to 5 documents
  const user = await User.findById(userId)
    .populate("enrolledCourses")
    .populate("instructor")
    // .populate("instructor", "name bio email") // Add this
    .select(
      "title description category level price thumbnail sections instructor",
    )
    .limit(5);
  if (!user) {
    throw new AppError("No User Found", 404);
  }

  console.log(user.enrolledCourses);

  return res.status(200).json({
    success: true,
    enrolledCourses: user.enrolledCourses,
    message: "User Courses Fetched",
  });
});
//#endregion

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement get current user profile functionality
});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  // TODO: Implement update user profile functionality
});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  // TODO: Implement change user password functionality
});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  // TODO: Implement forgot password functionality
});

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  // TODO: Implement reset password functionality
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  // TODO: Implement delete user account functionality
});
