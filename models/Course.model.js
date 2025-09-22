import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxLength: [100, "Course title cannot exceed 100 characters"],
    },
    // subtitle: {
    //   type: String,
    //   trim: true,
    //   maxLength: [200, "Course subtitle cannot exceed 200 characters"],
    // },
    description: {
      type: String,
      trim: true,
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
        values: ["beginner", "intermediate", "advanced"],
        message: "Please select a valid course level",
      },
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [0, "Course price must be non-negative"],
    },
    thumbnail: {
      type: String,
      required: [true, "Course thumbnail is required"],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sections: [
      {
        title: { type: String },
        // min: [1, "Course must contain at least one section"],
        // max: [20, "Course can only contain max 20 section"],
        lectures: {
          type: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Lecture",
            },
          ],
          validate: {
            validator: function (arr) {
              return arr.length <= 30;
            },
            message: "A section cannot have more than 30 lectures.",
          },
        },
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
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
    notes: [{ type: String }], // Make a schema for notes
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//#region Virtual field for average rating (to be implemented with reviews)
courseSchema.virtual("averageRating").get(function () {
  return 0; // Placeholder until review system is implemented
});
//#endregion

//#region Update total lectures count when lectures are modified
courseSchema.pre("save", function (next) {
  if (this.lectures) {
    this.totalLectures = this.lectures.length;
  }
  next();
});
//#endregion

export const Course = mongoose.model("Course", courseSchema);
