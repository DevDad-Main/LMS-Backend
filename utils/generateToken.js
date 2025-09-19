import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
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

// export const generateToken = (res, user, message) => {
//   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });
//
//   return res
//     .status(200)
//     .cookie("token", token, {
//       httpOnly: true,
//       sameSite: "strict",
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     })
//     .json({
//       success: true,
//       message,
//       user,
//     });
// };
