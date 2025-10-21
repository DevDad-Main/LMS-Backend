import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
  createNote,
  getNotes,
  deleteNote,
} from "../controllers/note.controller.js";

const router = Router();

router.get("/:courseId/notes", isAuthenticated, getNotes);
router.post("/:courseId/add", isAuthenticated, createNote);
router.delete("/:courseId/:noteId", isAuthenticated, deleteNote);

export default router;
