import { Course } from "../models/Course.model.js";
import { Lecture } from "../models/Lecture.model.js";
import { User } from "../models/User.model.js";
import {
  uploadBufferToCloudinary,
  getPublicIdFromUrl,
  deleteImageFromCloudinary,
} from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import { isValidObjectId } from "mongoose";

//#region Create New Course
/**
 * Create a new course
 * @route POST /api/v1/courses
 */
export const createNewCourse = catchAsync(async (req, res) => {
  //TODO: Destructure req.body as its sent as whole object and JSON.parse sections field

  const { title, description, category, level, price } = req.body;
  console.log(req.body);

  const thumbnail = req.file;

  const course = await Course.create({
    title,
    description,
    category,
    level,
    price,
    instructor: req.user?._id,
    courseOwner: req.user?._id,
  });

  console.log(thumbnail);
  console.log(thumbnail.buffer);

  const result = await uploadBufferToCloudinary(
    thumbnail.buffer,
    course.folderId,
  );

  console.log("Result: ", result);

  if (!result) {
    throw new AppError("Can't upload thumbnail to cloundinary", 400);
  }

  course.thumbnail = result.secure_url;
  await course.save();

  return res.status(201).json({
    success: true,
    courseId: course._id,
    message: "Course Successfully Added",
  });
});
//#endregion

/**
 * Search courses with filters
 * @route GET /api/v1/courses/search
 */
export const searchCourses = catchAsync(async (req, res) => {
  // TODO: Implement search courses functionality
});

/**
 * Get all published courses
 * @route GET /api/v1/courses/published
 */
export const getPublishedCourses = catchAsync(async (req, res) => {
  // TODO: Implement get published courses functionality
});

//#region Get Admin/Instructor Created Courses
/**
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
 */
export const getMyCreatedCourses = catchAsync(async (req, res) => {
  //TODO: Later handle this differently with a seperate admin/instructor section
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new AppError("Not a valid ID", 404);
  }

  const courses = await Course.find({ courseOwner: userId }).select(
    "title description category level price thumbnail totalLectures totalDuration isPublished",
  );

  console.log(courses);
  return res
    .status(200)
    .json({ success: true, courses, message: "Courses fetched successfully" });
});
//#endregion

//#region Update Course Details
/**
 * Update course details
 * @route PATCH /api/v1/courses/:courseId
 */
export const updateCourseDetails = catchAsync(async (req, res) => {
  const { title, description, category, level, price, updateThumbnail } =
    req.body;
  const { courseId } = req.params;

  if (!isValidObjectId(courseId)) {
    throw new AppError("Invalid Course ID", 404);
  }

  const thumbnailFile = req.file;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const updateData = {
    title,
    description,
    category,
    level,
    price,
  };

  let thumbnail;
  if (updateThumbnail === "true" && thumbnailFile) {
    // Upload new thumbnail and delete old one
    const folderId = course.folderId || `course-${courseId}`;
    const result = await uploadBufferToCloudinary(
      thumbnailFile.buffer,
      folderId,
    );

    if (course.thumbnail) {
      const oldPublicId = getPublicIdFromUrl(course.thumbnail);
      await deleteImageFromCloudinary(oldPublicId);
    }

    thumbnail = result.secure_url;
  } else if (!updateThumbnail || updateThumbnail === "false") {
    // Keep existing thumbnail
    thumbnail = course.thumbnail;
  }

  Object.assign(course, updateData);
  await course.save();

  return res
    .status(200)
    .json({ success: true, course, message: "Course Updated Successfully" });
});
//#endregion

/**
 * Update course details
 * @route PUT /api/v1/course/update-lecture/${editingLectureId}
 */
export const updateCourseLecture = catchAsync(async (req, res) => {});

/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
//#region Get Course Details By ID
export const getCourseDetails = catchAsync(async (req, res) => {
  // TODO: Implement get course details functionality
  const { courseId } = req.params;

  console.log(req.params);

  if (!isValidObjectId(courseId)) {
    throw new AppError("Invalid Course ID", 404);
  }

  const course = await Course.findById(courseId)
    .populate({
      path: "sections",
      select: "title _id",
      populate: {
        path: "lectures",
        select: "title type content video _id",
      },
    })
    .select(
      "title description category level price thumbnail sections instructor",
    );

  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

  return res.status(200).json({
    success: true,
    course: {
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      thumbnail: course.thumbnail || "",
      sections: course.sections.map((section) => ({
        _id: section._id,
        title: section.title,
        lectures: section.lectures.map((lecture) => ({
          _id: lecture._id,
          title: lecture.title,
          type: lecture.type,
          content: lecture.content || "",
          video: lecture.video || "",
        })),
      })),
    },
  });
});
//#endregion

/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourse = catchAsync(async (req, res) => {
  // TODO: Implement add lecture to course functionality
  const { title, courseId } = req.body;
  console.log(req.body);

  const videoFile = req.file;

  if (!isValidObjectId(courseId)) {
    throw new AppError("Course Not Found", 404);
  }

  const course = await Course.findById(courseId);

  let videoUrl = "";
  let duration = 0;

  if (videoFile) {
    const folderId = course.folderId || `course-${courseId}`;
    const result = await uploadBufferToCloudinary(videoFile.buffer, folderId);
    videoUrl = result.secure_url;
    duration = result.duration || 0;
  } else {
    return res.status(400).json({
      success: false,
      message: "Video file is required for video lectures",
    });
  }

  const lecture = await Lecture.create({
    title,
    // content: type === "Text" ? content : undefined,
    videoUrl: videoUrl,
    duration,
    course: courseId,
  });

  await Course.findByIdAndUpdate(
    courseId,
    {
      $push: { lectures: lecture._id },
      $inc: { totalLectures: 1, totalDuration: duration },
    },
    { new: true },
  );

  res.status(201).json({
    success: true,
    lectureId: lecture._id,
    lecture,
  });
});

/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {
  // TODO: Implement get course lectures functionality
});
