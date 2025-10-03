import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  createNote,
  getNotes,
  deleteNote,
} from "../controllers/note.controller.js";

const router = Router();

router.post("/:courseId/add", isAuthenticated, createNote);
router.get("/:courseId/notes", isAuthenticated, getNotes);
router.delete("/:courseId/:noteId", isAuthenticated, deleteNote);

export default router;
