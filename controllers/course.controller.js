import { Course } from "../models/Course.model.js";
import { Review } from "../models/Review.model.js";
import { CourseProgress } from "../models/CourseProgress.model.js";
import { Section } from "../models/Section.model.js";
import { Lecture } from "../models/Lecture.model.js";
import { Instructor } from "../models/Instructor.model.js";
import {
  uploadBufferToCloudinary,
  getPublicIdFromUrl,
  deleteImageFromCloudinary,
  deleteCourseFolderFromCloudinary,
} from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import mongoose, { isValidObjectId } from "mongoose";
import {
  cloudinaryImageUploaderQueue,
  cloudinaryImageQueueEvents,
} from "../queues/cloudinaryImageQueue.js";
import { cloudinaryDeleteImageQueue } from "../queues/cloudinaryDeleteImageQueue.js";

//#region Get Courses By Criteria -> Filters etc
/**
 * Gets all courses matched by the criteria sent from the frontend
 * @GET /api/v1/course/all?
 * */
export const getCoursesByCriteria = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 3,
    search,
    category,
    level,
    sort = "newest",
  } = req.query;

  const query = {};
  if (search) query.title = { $regex: search, $options: "i" };
  if (category) query.category = decodeURIComponent(category).replace("-", " ");
  if (level) query.level = level;

  let sortOption = {};
  switch (sort) {
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "price-low":
      sortOption = { price: 1 };
      break;
    case "price-high":
      sortOption = { price: -1 };
      break;
    case "popular":
      sortOption = { studentsCount: -1 };
      break;
    case "rating":
      sortOption = { rating: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const courses = await Course.find(query)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("instructor", "name email"); // Populate instructor if needed

  const totalCourses = await Course.countDocuments(query);
  const totalPages = Math.ceil(totalCourses / limit);

  return res.json({
    success: true,
    courses,
    totalPages,
    totalCourses,
    message: "Courses fetched successfully",
  });
});

//#endregion

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
    tags,
    languages,
  } = req.body;

  let parsedRequirements = JSON.parse(requirements) || [];
  let parsedLearnableSkills = JSON.parse(learnableSkills) || [];
  let parsedTags = JSON.parse(tags) || [];
  let parsedLanguages = JSON.parse(languages) || [];

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
    tags: parsedTags,
    languages: parsedLanguages,
    instructor: req.instructor?._id,
    courseOwner: req.instructor?._id,
  });

  // console.log(thumbnail);
  // console.log(thumbnail.buffer);

  // let result;
  // try {
  //   result = await uploadBufferToCloudinary(thumbnail.buffer, course.folderId);
  //
  //   console.log("Result: ", result);
  //
  //   if (!result) {
  //     throw new AppError("Can't upload thumbnail to cloundinary", 400);
  //   }
  // } catch (error) {
  //   throw new AppError(error.message, error.status);
  // }

  try {
    const job = await cloudinaryImageUploaderQueue.add(
      "upload-new-image",
      {
        buffer: thumbnail.buffer,
        folderId: course.folderId,
      },
      {
        attempts: 3,
        backoff: 2000,
        removeOnComplete: 10, // NOTE: Using free redis instance so uncomment if we have issues
        // removeOnComplete: true, // NOTE: Using free redis instance so uncomment if we have issues
        removeOnFail: false,
      },
    );
    const result = await job.waitUntilFinished(cloudinaryImageQueueEvents);
    console.log("Result from Job: ", result);
    course.thumbnail = result.secure_url || "";

    await course.save();
  } catch (error) {
    console.log("New Job Upload Error details: ", error);
    throw new AppError("Failed To Upload Avatar", 400, error);
  }

  // course.thumbnail = result.secure_url || "";
  // await course.save();

  await Instructor.findByIdAndUpdate(req.instructor?._id, {
    $addToSet: { createdCourses: course },
  });

  return res.status(201).json({
    success: true,
    courseId: course._id,
    message: "Course Successfully Added",
  });
});
//#endregion

//#region Get Admin/Instructor Created Courses
/**
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
 */
export const getCourses = catchAsync(async (req, res) => {
  //TODO: Later handle this differently with a seperate admin/instructor section

  const courses = await Course.find()
    .populate({
      path: "sections",
      select: "_id",
      populate: {
        path: "lectures",
        select: "_id duration",
      },
    })
    .populate("instructor")
    .select(
      "title description category level price thumbnail sections instructor enrolledStudents ",
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
    tags,
    languages,
    updateThumbnail,
    updateRequirements,
    updateLearnableSkills,
    updateTags,
    updateLanguages,
  } = req.body;

  console.log(req.body);

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
  if (updateTags === "true" && tags) {
    update.tags = JSON.parse(tags);
  }
  if (updateLanguages === "true" && languages) {
    update.languages = JSON.parse(languages);
  }

  // let thumbnail;
  if (updateThumbnail === "true" && req.file) {
    const folderId = courseFolderId.folderId || `course-${courseFolderId._id}`;

    try {
      const job = await cloudinaryImageUploaderQueue.add(
        "upload-new-image",
        {
          buffer: req.file.buffer,
          folderId,
        },
        {
          attempts: 3, // Rety 3 times
          backoff: 2000, // Wait for 2 seconds before retrying
          removeOnComplete: 100, //N NOTE: Only keep the last 100 jobs in the queue - Good for testing
          // removeOnComplete: true, // NOTE: Using free redis instance so uncomment if we have issues
          removeOnFail: false,
        },
      );
      const result = await job.waitUntilFinished(cloudinaryImageQueueEvents);
      console.log("Result from Job: ", result);
      update.thumbnail = result.secure_url;

      // await course.save();
    } catch (error) {
      console.log("New Job Upload Error details: ", error);
    }

    //#region Cloudinary Delete Job
    try {
      if (courseFolderId.thumbnail) {
        const oldPublicId = getPublicIdFromUrl(courseFolderId.thumbnail);
        await cloudinaryDeleteImageQueue.add("delete-old-image", {
          oldPublicId,
        });
      }
    } catch (error) {
      console.log("New Job Deletion Error details: ", error);
    }
    //#endregion
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

//#region Update Course Lecture
/**
 * Update course details
 * @route PUT /api/v1/course/update-lecture/${editingLectureId}
 */
export const updateCourseLecture = catchAsync(async (req, res) => {
  const { savedCourseId, editingLectureId } = req.params;
  const { title, updateVideo } = req.body;

  console.log("Request body:", req.body);
  console.log("Uploaded file:", req.file);

  const lectureFolderId = await Lecture.findById(editingLectureId);

  const update = {};
  if (title) update.title = title;

  if (updateVideo === "true" && req.file) {
    const folderId =
      lectureFolderId.folderId || `lecture-${lectureFolderId._id}`;
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      folderId,
      "video",
    );

    if (lectureFolderId.videoUrl) {
      const oldPublicId = getPublicIdFromUrl(lectureFolderId.videoUrl);
      await deleteImageFromCloudinary(oldPublicId, "video");
    }

    update.videoUrl = result.secure_url;
  } else if (!updateVideo || updateVideo === "false") {
    update.videoUrl = lectureFolderId.videoUrl;
  }

  const lecture = await Lecture.findByIdAndUpdate(
    editingLectureId,
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!lecture) {
    throw new AppError("Course Not Found", 404);
  }

  return res
    .status(200)
    .json({ success: true, lecture, message: "Lecture updated successfully" });
});
//#endregion

//#region Update Course Section
/**
 * Update course details
 * @route PUT /api/v1/course/update-lecture/${editingLectureId}
 */
export const updateCourseSection = catchAsync(async (req, res) => {
  const { savedCourseId, editingSectionId } = req.params;
  const { title } = req.body;

  if (!isValidObjectId(savedCourseId) || !isValidObjectId(editingSectionId)) {
    throw new AppError("Course ID or Section ID are not valid ID's", 400);
  }

  const section = await Section.findByIdAndUpdate(editingSectionId, {
    $set: { title },
  });

  return res
    .status(200)
    .json({ success: true, section, message: "Section Updated Successfully" });
});
//#endregion

//#region Get Course Details By ID
/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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
          select: "title videoUrl _id duration",
        },
      })
      .select(
        "title description category level price thumbnail sections instructor subtitle requirements learnableSkills enrolledStudents lastUpdated tags languages",
      )
      .session(session);

    if (!course) {
      throw new AppError("Course Not Found", 404);
    }

    const instructor = await Instructor.findById(course.instructor)
      .populate({ path: "createdCourses", select: "title subtitle" })
      .populate({
        path: "studentCount",
        select: "enrolledStudents",
      })
      .session(session);

    const reviews = await Review.find({ course: id })
      .populate("user")
      .session(session);

    const totalStudents = instructor.studentCount.reduce(
      (sum, course) => sum + course.enrolledStudents.length,
      0,
    );

    // Fetch user's completed lectures for this course
    const userCourseProgress = await CourseProgress.findOne({
      user: userId,
      course: id,
    }).session(session);

    const completedLectures = userCourseProgress?.completedLectures || [];

    await session.commitTransaction();
    session.endSession();

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
        enrolledStudents: course.enrolledStudents.length,
        duration: course.duration, // Explicitly call virtual
        lastUpdated: course.lastUpdated,
        requirements: course.requirements,
        learnableSkills: course.learnableSkills,
        tags: course.tags,
        languages: course.languages,
        thumbnail: course.thumbnail || "",
        instructor: instructor,
        totalStudents,
        reviews,
        sections: course.sections.map((section) => ({
          _id: section._id,
          title: section.title,
          lectures: section.lectures.map((lecture) => ({
            _id: lecture._id,
            title: lecture.title,
            video: lecture.videoUrl || "",
            duration: lecture.duration,
            isCompleted: completedLectures.includes(lecture._id.toString()), // <-- toggle
          })),
        })),
      },
      completedLectures,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(error.message, error.status);
  }
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
    try {
      const folderId = course.folderId || `course-${courseId}`;
      const result = await uploadBufferToCloudinary(
        videoFile.buffer,
        folderId,
        "video",
      );
      videoUrl = result.secure_url;
      duration = result.duration || 0;
    } catch (error) {
      console.log("Video Upload Failed.. ", error);
    }
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

//#region Delete Section
export const deleteSection = catchAsync(async (req, res) => {
  const { savedCourseId, sectionId } = req.params;

  if (!isValidObjectId(savedCourseId) || !isValidObjectId(sectionId)) {
    throw new AppError("Invalid IDS", 400);
  }

  const section = await Section.findById(sectionId);

  if (!section) {
    throw new AppError("Section Not Found", 404);
  }

  const lectureIds = section.lectures;

  if (lectureIds.length > 0) {
    await Lecture.deleteMany({ _id: { $in: lectureIds } });
  }

  await Section.findByIdAndDelete(sectionId);

  await Course.findByIdAndUpdate(savedCourseId, {
    $pull: { sections: sectionId },
  });

  return res
    .status(200)
    .json({ success: true, message: "Deleted Successfully" });
});
//#endregion

//#region Delete Lecture
export const deleteLecture = catchAsync(async (req, res) => {
  const { savedCourseId, sectionId, lectureId } = req.params;

  if (
    !isValidObjectId(savedCourseId) ||
    !isValidObjectId(sectionId) ||
    !isValidObjectId(lectureId)
  ) {
    throw new AppError("Invalid Ids", 400);
  }

  const section = await Section.findByIdAndUpdate(sectionId, {
    $pull: { lectures: lectureId },
  });

  if (!section) {
    throw new AppError("No Section Found", 404);
  }

  await Lecture.findByIdAndDelete(lectureId);

  return res.status(200).json({ success: true, message: "Lecture deleted" });
});
//#endregion

//#region Delete Course
export const deleteCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  if (!isValidObjectId(courseId)) {
    throw new AppError("Invalid Course ID", 400);
  }

  const course = await Course.findByIdAndDelete(courseId);

  if (!course) {
    throw new AppError("Course Not Found", 404);
  }

  await Lecture.deleteMany({ course: course });
  await Section.deleteMany({ course: course });

  try {
    const result = await deleteCourseFolderFromCloudinary(course.folderId);
    console.log(result);
  } catch (error) {
    throw new AppError("Failed to remove Course Folder Assets", 400);
  }

  return res
    .status(200)
    .json({ success: true, message: "Course Deleted Successfully" });
});
//#endregion

//#region Update Course Progress Last Accessed
export const updateLastAccessed = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError("Invalid ID", 400);
  }

  const courseProgress = await CourseProgress.findOneAndUpdate(
    { course: id },
    { $set: { lastAccessed: Date.now() } },
  );

  if (!courseProgress) {
    throw new AppError("No Course Progress Found", 404);
  }

  return res.status(200).json({
    success: true,
    courseProgress,
    message: "Updated Last Accessed Course Field",
  });
});

//#endregion
