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
import mongoose, { isValidObjectId } from "mongoose";

//#region Create New Course
/**
 * Create a new course
 * @route POST /api/v1/courses
 */
export const createNewCourse = catchAsync(async (req, res) => {
  //TODO: Destructure req.body as its sent as whole object and JSON.parse sections field

  const {
    title,
    subtitle,
    description,
    category,
    level,
    price,
    requirements,
    learnableSkills,
  } = req.body;

  console.log(req.body);

  let parsedRequirements = [];
  let parsedLearnableSkills = [];
  try {
    parsedRequirements = JSON.parse(requirements);
    parsedLearnableSkills = JSON.parse(learnableSkills);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Invalid requirements or learnableSkills format" });
  }

  const thumbnail = req.file;

  const course = await Course.create({
    title,
    subtitle,
    description,
    category,
    level,
    price: parseFloat(price),
    requirements: parsedRequirements,
    learnableSkills: parsedLearnableSkills,
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
  const { id } = req.params;
  const {
    title,
    subtitle,
    description,
    category,
    level,
    price,
    requirements,
    learnableSkills,
    updateThumbnail,
    currentThumbnail,
    updateRequirements,
    updateLearnableSkills,
  } = req.body;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid Course ID", 404);
  }

  const courseFolderId = await Course.findById(id);

  const update = {};
  if (title) update.title = title;
  if (subtitle) update.subtitle = subtitle;
  if (description) update.description = description;
  if (category) update.category = category;
  if (level) update.level = level;
  if (price) update.price = parseFloat(price);

  // Handle array fields
  if (updateRequirements === "true" && requirements) {
    update.requirements = JSON.parse(requirements);
  }
  if (updateLearnableSkills === "true" && learnableSkills) {
    update.learnableSkills = JSON.parse(learnableSkills);
  }

  let thumbnail;
  if (updateThumbnail === "true" && req.file) {
    const folderId = courseFolderId.folderId || `course-${courseFolderId._id}`;
    const result = await uploadBufferToCloudinary(req.file.buffer, folderId);

    if (courseFolderId.thumbnail) {
      const oldPublicId = getPublicIdFromUrl(courseFolderId.thumbnail);
      await deleteImageFromCloudinary(oldPublicId);
    }

    update.thumbnail = result.secure_url;
  } else if (!updateThumbnail || updateThumbnail === "false") {
    update.thumbnail = courseFolderId.thumbnail;
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

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
  const { id } = req.params;
  const userId = req.user?._id;

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
    .select(
      "title description category level price thumbnail sections instructor subtitle requirements learnableSkills",
    );

  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

  // Fetch user's completed lectures for this course
  const userCourseProgress = await CourseProgress.findOne({
    user: userId,
    course: id,
  });

  const completedLectures = userCourseProgress?.completedLectures || [];

  return res.status(200).json({
    success: true,
    course: {
      _id: course._id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      requirements: course.requirements,
      learnableSkills: course.learnableSkills,
      thumbnail: course.thumbnail || "",
      sections: course.sections.map((section) => ({
        _id: section._id,
        title: section.title,
        lectures: section.lectures.map((lecture) => ({
          _id: lecture._id,
          title: lecture.title,
          video: lecture.videoUrl || "",
          isCompleted: completedLectures.includes(lecture._id.toString()), // <-- toggle
        })),
      })),
    },
    completedLectures,
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
    const result = await uploadBufferToCloudinary(
      videoFile.buffer,
      folderId,
      "video",
    );
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
  const userId = req.user?._id;

  console.log(req.body);

  if (!isValidObjectId(id) || !isValidObjectId(lectureId)) {
    throw new AppError("Invalid Course or Lecture ID", 400);
  }

  // const courseProgress = await CourseProgress.findOneAndUpdate(
  //   { user: userId, course: id },
  //   {
  //     $set: {
  //       //NOTE: Only setting the right field to completed specified by the filter below
  //       "lectureProgress.$[elem].isCompleted": isCompleted,
  //       lastAccessed: new Date(),
  //     },
  //   },
  //   {
  //     //NOTE: Array Filter we specify to we only update the specific element in the array the lectureId from the front end
  //     arrayFilters: [
  //       { "elem.lecture": new mongoose.Types.ObjectId(lectureId) },
  //     ],
  //     new: true, // Return the updated document
  //     runValidators: true,
  //   },
  // );
  const courseProgress = await CourseProgress.findOne({
    user: userId,
    course: id,
  });

  if (courseProgress) {
    await courseProgress.toggleLecture(lectureId);
  } else {
    await CourseProgress.create({
      user: userId,
      course: id,
      completedLectures: [lectureId],
    });
  }

  // console.log("Virtual:", courseProgress.completionPercentageBaby);
  // console.log("With toJSON:", courseProgress.toJSON());

  const isCompletedString = courseProgress.isCompleted
    ? "Completed"
    : "Not Completed";
  return res.status(200).json({
    success: true,
    message: `Course ${isCompletedString}`,
  });
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
