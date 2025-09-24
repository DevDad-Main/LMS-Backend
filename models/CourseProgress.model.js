import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema({
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: [true, "Lecture reference is required"],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  watchTime: {
    type: Number,
    default: 0,
  },
  lastWatched: {
    type: Date,
    default: Date.now,
  },
});

const courseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lectureProgress: [lectureProgressSchema],
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//#region Calculate Completion Percentage Virtual
// courseProgressSchema.virtual("completionPercentage").get(function () {
//   if (!this.lectureProgress || this.lectureProgress.length === 0) return 0;
//   const completed = this.lectureProgress.filter((lp) => lp.isCompleted).length;
//   return Math.round((completed / this.lectureProgress.length) * 100);
// });

courseProgressSchema.virtual("completionPercentage").get(function () {
  if (!this.course || !this.course.sections) return 0;

  // Flatten all lectures from all sections
  const totalLectures = this.course.sections.reduce((acc, section) => {
    return acc + (section.lectures?.length || 0);
  }, 0);

  if (totalLectures === 0) return 0;

  const completed = this.lectureProgress.filter((lp) => lp.isCompleted).length;

  return Math.round((completed / totalLectures) * 100);
});
//#endregion

//#region Update last accessed
courseProgressSchema.methods.updateLastAccessed = function () {
  this.lastAccessed = Date.now();
  return this.save({ validateBeforeSave: false });
};
//#endregion

export const CourseProgress = mongoose.model(
  "CourseProgress",
  courseProgressSchema,
);
