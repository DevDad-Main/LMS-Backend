import express from "express";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";
import {
  createNewCourse,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourse,
  getCourseLectures,
} from "../controllers/course.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);

// Protected routes
router.use(isAuthenticated);

// Course management
// router.route("/").get(restrictTo("instructor"), getMyCreatedCourses);
router.route("/courses").get(getMyCreatedCourses);

router
  .route("/add-course")
  // .post(restrictTo("instructor"), upload.single("thumbnail"), createNewCourse);
  .post(upload.single("thumbnail"), createNewCourse);
// Course details and updates
router
  .route("/c/:courseId")
  .get(getCourseDetails)
  .put(upload.single("thumbnail"), updateCourseDetails);
// .patch(
//   restrictTo("instructor"),
//   upload.single("thumbnail"),
//   updateCourseDetails,
// );

// Lecture management
router.route("/c/:courseId").get(getCourseLectures);
// .post(restrictTo("instructor"), upload.single("video"), addLectureToCourse);

router.post("/add-lecture", upload.single("videoFile"), addLectureToCourse);

router.put(
  "/update-lecture/:editingLectureId",
  upload.single("videoFile"),
  addLectureToCourse,
);

export default router;
