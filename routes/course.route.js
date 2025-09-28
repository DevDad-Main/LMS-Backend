import express from "express";
import {
  isAuthenticated,
  isInstructorAuthenticated,
  restrictTo,
} from "../middleware/auth.middleware.js";
import {
  createNewCourse,
  deleteCourse,
  addSection,
  searchCourses,
  getPublishedCourses,
  getCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourseAndSection,
  getCourseLectures,
  toggleLectureCompletion,
  updateCourseSection,
  updateCourseLecture,
  getCoursesByCriteria,
  deleteSection,
  deleteLecture,
} from "../controllers/course.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedCourses);
router.get("/all", getCoursesByCriteria);
router.get("/courses", getCourses);

router
  .route("/add-course")
  // .post(restrictTo("instructor"), upload.single("thumbnail"), createNewCourse);
  .post(upload.single("thumbnail"), isInstructorAuthenticated, createNewCourse);
// Course details and updates
router
  .route("/c/:id")
  .get(getCourseDetails)
  .put(
    upload.single("thumbnail"),
    isInstructorAuthenticated,
    updateCourseDetails,
  );

router.route("/learn/c/:id").get(isAuthenticated, getCourseDetails);

router.route("/c/:courseId").get(getCourseLectures).delete(deleteCourse);

router.post(
  "/add-lecture",
  upload.single("videoFile"),
  addLectureToCourseAndSection,
);

router.post(
  "/:courseId/add-section",
  isInstructorAuthenticated,
  upload.none(),
  addSection,
);
// router.put("/:courseId/update-section/:sectionId", protect, updateSection);
// router.delete("/:courseId/delete-section/:sectionId", protect, deleteSection);

// Lecture routes
router.post(
  "/:courseId/section/:sectionId/add-lecture",
  isInstructorAuthenticated,
  upload.single("videoFile"),
  addLectureToCourseAndSection,
);

router.post(
  "/:id/lecture/:lectureId/toggle-complete",
  isAuthenticated,
  toggleLectureCompletion,
);

router.put(
  "/:savedCourseId/update-lecture/:editingLectureId",
  upload.single("videoFile"),
  isInstructorAuthenticated,
  updateCourseLecture,
);

router.post(
  "/:savedCourseId/update-section/:editingSectionId",
  upload.none(),
  isInstructorAuthenticated,
  updateCourseSection,
);

router.delete(
  "/:savedCourseId/delete-section/:sectionId",
  isInstructorAuthenticated,
  deleteSection,
);

router.delete(
  "/:savedCourseId/section/:sectionId/delete-lecture/:lectureId",
  isInstructorAuthenticated,
  deleteLecture,
);

// router.delete("/:courseId/delete-lecture/:lectureId", protect, deleteLecture);

export default router;
