import { Course } from "../models/Course.model.js";
import { CourseProgress } from "../models/CourseProgress.model.js";
import { Section } from "../models/Section.model.js";
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
    "title description category level price thumbnail sections instructor",
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
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid Course ID", 404);
  }

  const thumbnailFile = req.file;

  const course = await Course.findById(id);
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
 * Update course details
 * @route PUT /api/v1/course/update-lecture/${editingLectureId}
 */
export const updateCourseSection = catchAsync(async (req, res) => {});

//#region Get Course Details By ID
/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {
  // TODO: Implement get course details functionality
  const { id } = req.params;
  const userId = req.user?._id;

  console.log(req.params);

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid Course ID", 404);
  }

  const course = await Course.findById(id)
    .populate({
      path: "sections",
      select: "title _id",
      populate: {
        path: "lectures",
        select: "title videoUrl _id",
      },
    })
    .populate("instructor")
    // .populate("instructor", "name bio email") // Add this
    .select(
      "title description category level price thumbnail sections instructor",
    );

  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

  const userCourseProgress = await CourseProgress.findOne({
    user: userId,
    course: id,
  }).populate("lectureProgress");

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
          video: lecture.videoUrl || "",
        })),
      })),
      lectureProgress: userCourseProgress.lectureProgress.map((lecture) => ({
        isCompleted: lecture.isCompleted,
      })),
    },
  });
});
//#endregion

//#region Add Lecture to section and course
/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourseAndSection = catchAsync(async (req, res) => {
  // TODO: Implement add lecture to course functionality

  console.log("req.body:", req.body);
  console.log("req.params:", req.params);
  console.log("req.file:", req.file);

  const { courseId, sectionId } = req.params;
  const { title, type, content } = req.body;
  const videoFile = req.file;

  // Validate courseId and sectionId
  if (!isValidObjectId(courseId) || !isValidObjectId(sectionId)) {
    throw new AppError("Invalid Course or Section ID");
  }

  if (!videoFile) {
    throw new AppError("Video file is required for video lectures", 400);
  }

  // Verify course exists and user is authorized
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

  // Verify section exists and belongs to the course
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new AppError("Section Not Found", 404);
  }

  if (section.course.toString() !== courseId) {
    throw new AppError("Section does not belong to this course", 400);
  }

  // Handle video upload for video lectures
  let videoUrl = "";
  let duration = 0;
  if (type === "Video" && videoFile) {
    const folderId = course.folderId || `course-${courseId}`;
    const result = await uploadBufferToCloudinary(videoFile.buffer, folderId);
    videoUrl = result.secure_url;
    duration = result.duration || 0;
  }

  // Create the lecture
  const lecture = await Lecture.create({
    title,
    videoUrl: videoUrl,
    duration,
    section: sectionId,
    course: courseId,
  });

  // Update the section with the new lecture
  await Section.findByIdAndUpdate(sectionId, {
    $push: { lectures: lecture._id },
  });

  // Update course totalDuration
  if (duration > 0) {
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalDuration: duration },
    });
  }

  return res.status(201).json({
    success: true,
    lectureId: lecture._id,
    lecture: {
      _id: lecture._id,
      title: lecture.title,
      type: lecture.type,
      content: lecture.content || "",
      video: lecture.videoUrl || "",
      duration: lecture.duration,
    },
  });
});
//#endregion

//#region Get Course Lectures
/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {
  // TODO: Implement get course lectures functionality
});
//#endregion

//#region Toggle Lecture Completion
/**
 * Post Toggle Lecture Complete
 * @route POST /api/v1/courses/:id/lecture/:lectureId/toggle-complete
 */
export const toggleLectureCompletion = catchAsync(async (req, res) => {
  const { isCompleted } = req.body;
  const { id, lectureId } = req.params;

  console.log(req.body);

  if (!isValidObjectId(id) || !isValidObjectId(lectureId)) {
    throw new AppError("Invalid Course or Lecture ID", 400);
  }

  const lecture = await Lecture.findByIdAndUpdate(lectureId, {
    $set: { isCompleted },
  });

  const isCompletedString = lecture.isCompleted ? "Completed" : "Not Completed";
  return res
    .status(200)
    .json({ success: true, message: `Course ${isCompletedString}` });
});
//#endregion

//#region Add Section to course
/**
 * Add Section to course
 * @route POST /api/v1/courses/:courseId/add-section
 */
export const addSection = catchAsync(async (req, res) => {
  console.log("req.body:", req.body);
  console.log("req.params:", req.params);

  const { courseId } = req.params;
  const { title } = req.body;

  if (!isValidObjectId(courseId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Course ID" });
  }

  if (!title) {
    return res
      .status(400)
      .json({ success: false, message: "Title is required" });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res
      .status(404)
      .json({ success: false, message: "Course not found" });
  }

  // if (course.instructor.toString() !== req.user._id.toString()) {
  //   return res.status(403).json({ success: false, message: "Unauthorized" });
  // }

  if (course.sections.length >= 20) {
    return res
      .status(400)
      .json({ success: false, message: "Maximum 20 sections allowed" });
  }

  const section = await Section.create({ title, course: courseId });
  await Course.findByIdAndUpdate(courseId, {
    $push: { sections: section._id },
  });

  res.status(201).json({ success: true, sectionId: section._id });
});
//#endregion
