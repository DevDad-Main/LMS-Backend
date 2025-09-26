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

//#region Calculate Completion Percentage Virtual
// courseProgressSchema.virtual("completionPercentage").get(function () {
//   if (!this.lectureProgress || this.lectureProgress.length === 0) return 0;
//   const completed = this.lectureProgress.filter((lp) => lp.isCompleted).length;
//   return Math.round((completed / this.lectureProgress.length) * 100);
// });

courseProgressSchema.virtual("completionPercentage").get(function () {
  if (!this.course?.sections || this.course.sections.length === 0) return 0;

  // Flatten all lectures in the course
  const allLectures = this.course.sections.flatMap(
    (section) => section.lectures || [],
  );
  if (allLectures.length === 0) return 0;

  const completedCount = this.completedLectures.length;
  return Math.round((completedCount / allLectures.length) * 100);
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
