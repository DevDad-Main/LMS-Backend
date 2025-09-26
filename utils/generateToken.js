import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { Instructor } from "../models/Instructor.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { AppError } from "../middleware/error.middleware.js";

//#region Generate Token
export default async function generateUserToken(userId) {
  try {
    if (!isValidObjectId(userId)) {
      throw new AppError("Invalid User Id", 404);
    }
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return { token };
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}
//#endregion

//#region Generate Token
export async function generateInstructorToken(instructorId) {
  try {
    if (!isValidObjectId(instructorId)) {
      throw new AppError("Invalid Instructor Id", 404);
    }
    const instructor = await Instructor.findById(instructorId).select("_id");

    if (!instructor) {
      throw new AppError("User not found", 404);
    }

    const token = jwt.sign({ _id: instructor._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return { token };
  } catch (error) {
    throw new AppError(error.message, 500);
  }
}
//#endregion
