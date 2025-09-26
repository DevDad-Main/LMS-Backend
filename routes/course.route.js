import express from "express";
import {
  isAuthenticated,
  isInstructorAuthenticated,
  restrictTo,
} from "../middleware/auth.middleware.js";
import {
  createNewCourse,
  addSection,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourseAndSection,
  getCourseLectures,
  toggleLectureCompletion,
  updateCourseSection,
  updateCourseLecture,
} from "../controllers/course.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);

// Protected routes
// router.use(isAuthenticated);

// Course management
// router.route("/").get(restrictTo("instructor"), getMyCreatedCourses);

router.route("/courses").get(getMyCreatedCourses);

router
  .route("/add-course")
  // .post(restrictTo("instructor"), upload.single("thumbnail"), createNewCourse);
  .post(upload.single("thumbnail"), createNewCourse);
// Course details and updates
router
  .route("/c/:id")
  .get(getCourseDetails)
  .put(
    upload.single("thumbnail"),
    isInstructorAuthenticated,
    updateCourseDetails,
  );
// .patch(
//   restrictTo("instructor"),
//   upload.single("thumbnail"),
//   updateCourseDetails,
// );

// Lecture management
router.route("/c/:courseId").get(getCourseLectures);
// .post(restrictTo("instructor"), upload.single("video"), addLectureToCourse);

router.post(
  "/add-lecture",
  upload.single("videoFile"),
  addLectureToCourseAndSection,
);

//TODO: Add An Update Controller
router.put(
  "/update-lecture/:editingLectureId",
  upload.single("videoFile"),
  // addLectureToCourseAndSection,
);

//TODO: Add Later
// // Section routes
router.post(
  "/:courseId/add-section",

  upload.none(),
  addSection,
);
// router.put("/:courseId/update-section/:sectionId", protect, updateSection);
// router.delete("/:courseId/delete-section/:sectionId", protect, deleteSection);

// Lecture routes
router.post(
  "/:courseId/section/:sectionId/add-lecture",

  upload.single("videoFile"),
  addLectureToCourseAndSection,
);

router.post(
  "/:id/lecture/:lectureId/toggle-complete",

  toggleLectureCompletion,
);

router.put(
  "/:savedCourseId/update-lecture/:editingLectureId",
  upload.single("videoFile"),
  updateCourseLecture,
);

router.post(
  "/:savedCourseId/update-section/:editingSectionId",
  upload.none(),
  updateCourseSection,
);

// router.delete("/:courseId/delete-lecture/:lectureId", protect, deleteLecture);

export default router;
