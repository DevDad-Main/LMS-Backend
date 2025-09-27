import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["instructor"],
        message: "Please select a valid role",
      },
      default: "instructor",
    },
    expertise: {
      type: Array,
    },
    profession: { type: String },
    avatar: {
      type: String,
      default: "default-avatar.png",
    },
    bio: {
      type: String,
      maxLength: [400, "Bio cannot exceed 200 characters"],
    },
    createdCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    folderId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//#region Initialize FolderId Before Saving New Course
instructorSchema.pre("save", function (next) {
  if (!this.folderId) {
    this.folderId = uuidv7();
  }
  next();
});
//#endregion

export const Instructor = mongoose.model("Instructor", instructorSchema);
