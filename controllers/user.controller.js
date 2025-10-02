import { User } from "../models/User.model.js";
import { Instructor } from "../models/Instructor.model.js";
import { CourseProgress } from "../models/CourseProgress.model.js";
import bcrypt from "bcryptjs";
import generateUserToken from "../utils/generateToken.js";
import {
  uploadBufferToCloudinary,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
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

  const instructor = await Instructor.findOne({ email });
  if (instructor) {
    throw new AppError(
      "A User already exists with that email. Please choose another",
      400,
    );
  }

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "google",
      lastActive: Date.now(),
    });
  }

  // // Real course ID
  // const courseId = new mongoose.Types.ObjectId("68d5418149b6fb48a22d8344");
  //
  // // Find the course
  // const course = await Course.findById(courseId).populate({
  //   path: "sections",
  //   select: "title _id",
  //   populate: {
  //     path: "lectures",
  //     select: "title videoUrl isCompleted _id",
  //     model: "Lecture", // Explicitly specify the model name
  //   },
  // });
  //
  // console.log(course);
  // if (!course) {
  //   throw new AppError("Course not found", 404);
  // }
  //
  // await User.findByIdAndUpdate(
  //   user._id,
  //   {
  //     $addToSet: {
  //       enrolledCourses: {
  //         course: course._id, // <-- the ObjectId of the course
  //         enrolledAt: new Date(),
  //       },
  //     },
  //   },
  //   { new: true },
  // );

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
});
//#endregion

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

  const user = await User.findById(userId).populate({
    path: "enrolledCourses.course",
    select: "_id thumbnail title",
    populate: {
      path: "instructor",
      select: "name",
    },
  });

  // .populate("instructor", "name bio email") // Add this
  if (!user) {
    throw new AppError("No User Found", 404);
  }

  const courseIds = user.enrolledCourses.map((course) => {
    return course.course._id;
  });

  const courseProgresses = await CourseProgress.find({
    user: user._id,
    course: { $in: courseIds },
  }).populate({
    path: "course",
    select: "sections",
    populate: {
      path: "sections",
      select: "lectures",
    },
  });

  return res.status(200).json({
    success: true,
    coursesProgress: courseProgresses,
    enrolledCourses: user.enrolledCourses,
    message: "User Courses Fetched",
  });
});
//#endregion

//#region Add Course To Cart
export const addCourseToCart = catchAsync(async (req, res) => {
  const { courseId } = req.body;

  if (!isValidObjectId(courseId)) {
    throw new AppError("Invalid Course ID", 400);
  }

  // Find the user
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new AppError("User Not Found", 404);
  }

  // Check if course is already in cart
  const alreadyInCart = user.cart.some(
    (item) => item.course.toString() === courseId,
  );

  if (alreadyInCart) {
    throw new AppError("Course already in cart", 400);
  }

  user.cart.push({ course: courseId, quantity: 1 });
  await user.save();

  return res.status(200).json({
    success: true,
    cart: user.cart,
    message: "Item added to cart",
  });
});
//#endregion

//#region Delete Course From Cart
export const deleteCourseFromCart = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Course ID is not valid", 400);
  }
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const inCart = user.cart.some(
    (item) => item.course.toString() === id.toString(),
  );

  if (!inCart) {
    throw new AppError("Course not found in cart", 400);
  }

  // Pull the course from cart
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $pull: { cart: { course: id } } },
    { new: true },
  );

  return res.status(200).json({
    success: true,
    cart: updatedUser.cart,
    message: "Course removed from cart",
  });
});

//#endregion

//#region Get Users Cart
export const getUsersCart = catchAsync(async (req, res) => {
  const user = await User.findById(req.user?._id).populate({
    path: "cart",
    select: "course quantity",
    populate: {
      path: "course",
      populate: [
        {
          path: "sections",
          select: "lectures",
        },
        {
          path: "instructor", // populate instructor inside course
          select: "name title avatar bio expertise yearsOfExperience",
        },
      ],
    },
  });

  if (!user) {
    throw new AppError("No User Found", 404);
  }

  return res.status(200).json({
    success: true,
    cart: user.cart,
    message: "Cart fetched successfully",
  });
});
//#endregion

//#region Get Users Dashboard
/**
 * Get current users dashboard details
 * @route GET /api/v1/users/dashboard
 */
export const getUsersDashboard = catchAsync(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new AppError("Invalid User ID", 400);
  }

  const user = await User.findById(userId).populate({
    path: "enrolledCourses",
    select: "course",
    populate: {
      path: "course",
      populate: [
        { path: "instructor" },
        { path: "sections", populate: { path: "lectures" } },
      ],
    },
  });

  if (!user) {
    throw new AppError("User Not Found", 404);
  }

  const courseProgress = await CourseProgress.find({ user: userId })
    .populate({
      path: "course",
      populate: {
        path: "sections",
        select: "lectures",
      },
    })
    .sort({ createdAt: -1 });

  const completedCourses = await CourseProgress.find({
    user: req.user?._id,
    isCompleted: true,
  });

  console.log(completedCourses);

  return res.status(200).json({
    success: true,
    user,
    courseProgress,
    message: "Dashboard Data Fetched",
  });
});
//#endregion

/**
 * Get current users completed courses
 * @route GET /api/v1/users/dashboard
 */
export const getUsersCompletedCourses = catchAsync(async (req, res) => {
  const courseProgresses = await CourseProgress.find({
    user: req.user?._id,
    isCompleted: true,
  });

  if (!courseProgresses) {
    throw new AppError("No Course Progresses Found", 404);
  }

  console.log(courseProgresses);
  return res
    .status(200)
    .json({ success: true, courseProgresses, message: "DetailsFetched" });
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
