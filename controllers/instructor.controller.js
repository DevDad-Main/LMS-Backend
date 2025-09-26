import { User } from "../models/User.model.js";
import { Instructor } from "../models/Instructor.model.js";
import bcrypt from "bcryptjs";
import { generateInstructorToken } from "../utils/generateToken.js";
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
 * Create a new instructor account via google
 * @route POST /api/v1/instructor/google-login
 */
//#region Create User Account With Google
export const createInstructorAccountWithGoogle = catchAsync(
  async (req, res) => {
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

    const user = await User.findOne({ email });
    if (user) {
      throw new AppError(
        "A User already exists with that email. Please choose another",
        400,
      );
    }

    // Find or create user
    let instructor = await Instructor.findOne({ email });
    if (!instructor) {
      instructor = await Instructor.create({
        name,
        email,
        password: hashedPassword,
        authProvider: "google",
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
    const { token } = await generateInstructorToken(instructor._id);

    return res
      .status(201)
      .cookie("token", token, options)
      .json({
        success: true,
        token,
        instructor: {
          name: instructor.name,
          email: instructor.email,
          authProvider: instructor.authProvider,
        },
        message: "Google Login Successful",
      });
  },
);
//#endregion
