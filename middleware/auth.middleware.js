import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";
import { catchAsync } from "./error.middleware.js";
import { User } from "../models/User.model.js";
import { Instructor } from "../models/Instructor.model.js";

export const isAuthenticated = catchAsync(async (req, res, next) => {
  // Check if token exists in cookies
  const token = req.cookies.token;
  if (!token) {
    throw new AppError(
      "You are not logged in. Please log in to get access.",
      401,
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded?._id).select("-password");

    if (!user) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token. Please log in again.", 401);
    }
    if (error.name === "TokenExpiredError") {
      throw new AppError("Your token has expired. Please log in again.", 401);
    }
    throw error;
  }
});

export const isInstructorAuthenticated = catchAsync(async (req, res, next) => {
  // Check if token exists in cookies
  const token = req.cookies.instructorToken;

  if (!token && req.cookies.token)
    return res.json({ message: "No Need To Proceed" });

  if (!token) {
    throw new AppError(
      "You are not logged in. Please log in to get access.",
      401,
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const instructor = await Instructor.findById(decoded?._id).select(
      "-password",
    );

    if (!instructor) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    req.instructor = instructor;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid token. Please log in again.", 401);
    }
    if (error.name === "TokenExpiredError") {
      throw new AppError("Your token has expired. Please log in again.", 401);
    }
    throw error;
  }
});

// Middleware for role-based access control
export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // roles is an array ['admin', 'instructor']
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }
    next();
  });
};

// Optional authentication middleware
export const optionalAuth = catchAsync(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      req.id = decoded.userId;
    }
    next();
  } catch (error) {
    // If token is invalid, just continue without authentication
    next();
  }
});
