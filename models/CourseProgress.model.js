import mongoose from "mongoose";

// const lectureProgressSchema = new mongoose.Schema({
//   lecture: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Lecture",
//     required: [true, "Lecture reference is required"],
//   },
//   isCompleted: {
//     type: Boolean,
//     default: false,
//   },
//   watchTime: {
//     type: Number,
//     default: 0,
//   },
//   lastWatched: {
//     type: Date,
//     default: Date.now,
//   },
// });

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
    // isCompleted: {
    //   type: Boolean,
    //   default: false,
    // },
    hasReview: { type: Boolean, default: false },
    completedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    // lectureProgress: [lectureProgressSchema],
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

//#region Calculate Completion Method
courseProgressSchema.methods.calculateCompletion = function () {
  const totalLectures = this.course?.sections?.reduce(
    (acc, s) => acc + (s.lectures?.length || 0),
    0,
  );
  const completedCount = this.completedLectures?.length || 0;
  if (!totalLectures) return 0;
  return Math.round((completedCount / totalLectures) * 100);
};
//#endregion

//#region Completion Percentage Virtual
courseProgressSchema.virtual("completionPercentage").get(function () {
  return this.calculateCompletion();
});
//#endregion

//#region Is Course Completed Virtual
courseProgressSchema.virtual("isCompleted").get(function () {
  return this.calculateCompletion() === 100;
});
//#endregion

//#region Toggle Complete Lecture
courseProgressSchema.methods.toggleLecture = async function (lectureId) {
  if (this.completedLectures.includes(lectureId)) {
    await this.updateOne({ $pull: { completedLectures: lectureId } });
  } else {
    await this.updateOne({ $addToSet: { completedLectures: lectureId } });
  }
  return this;
};
//#endregion

//#region Update last accessed
courseProgressSchema.virtual("lastAccessedCourse").get(function () {
  this.lastAccessed = Date.now();
  return this.save({ validateBeforeSave: false });
});
//#endregion

export const CourseProgress = mongoose.model(
  "CourseProgress",
  courseProgressSchema,
);
