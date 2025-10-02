import { User } from "../models/User.model.js";
import { Instructor } from "../models/Instructor.model.js";
import bcrypt from "bcryptjs";
import { generateInstructorToken } from "../utils/generateToken.js";
import {
  uploadBufferToCloudinary,
  deleteImageFromCloudinary,
  getPublicIdFromUrl,
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

//#region Create User Account With Google
/**
 * Create a new instructor account via google
 * @route POST /api/v1/instructor/google-login
 */
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
      throw new AppError("This account is not a verified instructor", 400);
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
      .cookie("instructorToken", token, options)
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

//#region Instructor Register With Form
export const instructorRegisterWithForm = catchAsync(async (req, res) => {
  const { name, email, password, profession, bio, expertise } = req.body;

  const exisitngInstructor = await Instructor.findOne({ email });

  if (exisitngInstructor) {
    throw new AppError("Email already taken, Please choose another..", 400);
  }

  const avatarFile = req.file;

  const parsedExpertise = JSON.parse(expertise) || [];
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const instructor = await Instructor.create({
    name,
    email,
    password: hashedPassword,
    profession,
    bio,
    expertise: parsedExpertise,
  });

  let avatar;
  try {
    avatar = await uploadBufferToCloudinary(
      avatarFile.buffer,
      instructor.folderId,
    );
  } catch (error) {
    throw new AppError("Failed To Upload Avatar", 400);
  }

  instructor.avatar = avatar.secure_url || "";
  await instructor.save();

  const { token } = await generateInstructorToken(instructor?._id);

  return res
    .status(201)
    .cookie("instructorToken", token, options)
    .json({
      success: true,
      token,
      instructor: {
        name: instructor.name,
        email: instructor.email,
        authProvider: instructor.authProvider,
      },
    });
});
//#endregion

//#region Instructor Local Login
export const instructorLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  //NOTE: Only retrieving it like so due to bcrypt undefined error below as in our schema we set select to false;
  const instructor = await Instructor.findOne({ email }).select("+password");

  if (!instructor) {
    throw new AppError("Instructor Not Found", 404);
  }
  const doesPasswordMatch = await bcrypt.compare(password, instructor.password);

  if (!doesPasswordMatch) {
    throw new AppError("Incorrect Password", 401);
  }

  const { token } = await generateInstructorToken(instructor?._id);

  return res
    .status(200)
    .cookie("instructorToken", token, options)
    .json({
      success: true,
      token,
      instructor: {
        name: instructor.name,
        email: instructor.email,
        authProvider: instructor.authProvider,
      },
    });
});
//#endregion

//#region Instructor SignOut
/**
 * Sign out instructor and clear cookie
 * @route GET /api/v1/instructor/signout
 */
export const signOutInstructor = catchAsync(async (_, res) => {
  return res
    .status(200)
    .clearCookie("instructorToken", options)
    .json({ success: true, message: "Instructor Signed Out" });
});
//#endregion

//#region Instructor Authentication
/**
 * Authenticate user and get token to keep user logged in
 * @route POST /api/v1/users/signin
 */
export const authenticateInstructor = catchAsync(async (req, res) => {
  const instructorId = req.instructor?._id;

  if (!isValidObjectId(instructorId)) {
    throw new AppError("Invalid Instructor Id", 400);
  }

  const instructor = await Instructor.findById(instructorId);

  if (!instructor) {
    throw new AppError("Instructor Not Found", 400);
  }

  return res.status(200).json({
    success: true,
    instructor,
    message: "Instructor Passed Authentication Check",
  });
});
//#endregion

//#region Get Instructors Courses
export const getInstructorsCourses = catchAsync(async (req, res) => {
  const instructorId = req.instructor?._id;

  if (!isValidObjectId(instructorId)) {
    throw new AppError("Invalid Instructor ID", 400);
  }

  const instructor =
    await Instructor.findById(instructorId).populate("createdCourses");

  if (!instructor) {
    throw new AppError("No courses found for this instructor", 404);
  }

  console.log(instructor.createdCourses);

  return res.status(200).json({
    success: true,
    courses: instructor.createdCourses,
    message: "Courses Fetched Successful",
  });
});
//#endregion

//#region Get Instructor Details
export const getInstructorProfile = catchAsync(async (req, res) => {
  const instructorID = req.instructor?._id;

  if (!isValidObjectId(instructorID)) {
    throw new AppError("Invalid ID", 400);
  }

  const instructor = await Instructor.findById(instructorID);

  if (!instructor) {
    throw new AppError("No Instructor Found", 404);
  }

  return res.status(200).json({ success: true, instructor });
});
//#endregion

//#region Get Instructor Details
export const getInstructorProfilePage = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid ID", 400);
  }

  const instructor = await Instructor.findById(id).populate("createdCourses");

  if (!instructor) {
    throw new AppError("No Instructor Found", 404);
  }

  return res.status(200).json({ success: true, instructor });
});
//#endregion

//#region Update Instructor Profile Details
export const updateInstructorDetails = catchAsync(async (req, res) => {
  const instructorID = req.instructor?._id;

  if (!isValidObjectId(instructorID)) {
    throw new AppError("Invalid ID", 400);
  }

  const { name, profession, bio, expertise, updateAvatar, updateExpertise } =
    req.body;

  const update = {};
  if (name) update.name = name;
  if (profession) update.profession = profession;
  if (bio) update.bio = bio;

  if (updateExpertise === "true" && expertise) {
    update.expertise = JSON.parse(expertise);
  }

  const instructor = await Instructor.findById(instructorID);

  if (updateAvatar === "true" && req.file) {
    const folderId = instructor.folderId || `instructor-${instructor._id}`;
    const result = await uploadBufferToCloudinary(req.file.buffer, folderId);

    if (instructor.avatar) {
      const oldPublicId = getPublicIdFromUrl(instructor.avatar);
      await deleteImageFromCloudinary(oldPublicId);
    }

    update.avatar = result.secure_url;
  } else if (!updateAvatar || updateAvatar === "false") {
    update.avatar = instructor.avatar;
  }

  const updatedInstructor = await Instructor.findByIdAndUpdate(
    instructorID,
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!updatedInstructor) {
    throw new AppError("Course Not Found", 404);
  }

  return res.status(200).json({
    success: true,
    instructor: updatedInstructor,
    message: "Course Updated Successfully",
  });
});
//#endregion
