import mongoose from "mongoose";
import { v7 as uuidv7 } from "uuid";

//#region Course Schema
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxLength: [100, "Course title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      // maxLength: [200, "Course subtitle cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      // maxLength: [200, "Course subtitle cannot exceed 200 characters"],
    },
    learnableSkills: {
      type: Array,
      required: true,
      validate: [limitArray(6), "Cannot have more than 6 learnable skills"],
    },
    requirements: {
      type: Array,
      required: true,
      validate: [limitArray(6), "Cannot have more than 6 requirements"],
    },
    tags: {
      type: Array,
      required: true,
      validate: [limitArray(5), "Cannot have more than 5 tags"],
    },
    languages: {
      type: Array,
      required: true,
      max: 5,
      validate: [limitArray(5), "Cannot have more than 5 languages"],
    },
    category: {
      type: String,
      enum: [
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Machine Learning",
        "Business",
        "Marketing",
        "Design",
        "Photography",
      ],
      required: [true, "Course category is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ["Beginner", "Intermediate", "Advanced"],
        message: "Please select a valid course level",
      },
      default: "Beginner",
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Course price must be non-negative"],
    },
    thumbnail: {
      type: String,
      // required: [true, "Course thumbnail is required"],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: [true, "Course instructor is required"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    // DAta gathered from the video wehn we upload to cloudinary
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
    folderId: {
      type: String,
      unique: true,
    },
    courseOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course Owner is required"],
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
//#endregion

//#region Virtual field for average rating (to be implemented with reviews)
courseSchema.virtual("averageRating").get(function () {
  return 0; // Placeholder until review system is implemented
});
//#endregion

//#region Course Duration Virtual
courseSchema.virtual("duration").get(function () {
  if (!this.sections || this.sections?.length === 0) return 0;

  let total = 0;
  for (const section of this.sections) {
    if (section.lectures) {
      for (const lecture of section.lectures) {
        total += lecture.duration || 0;
      }
    }
  }
  return total;
});
//#endregion

//#region Limit Array Validation
function limitArray(limit) {
  return function (value) {
    if (value.length > limit) {
      throw new Error(`Cannot have more than ${limit} items`);
    }
    return value.length <= limit;
  };
}
//#endregion

//#region Initialize FolderId Before Saving New Course
courseSchema.pre("save", function (next) {
  if (!this.folderId) {
    this.folderId = uuidv7();
  }
  next();
});
//#endregion

export const Course = mongoose.model("Course", courseSchema);
