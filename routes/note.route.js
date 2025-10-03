import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { createNote } from "../controllers/note.controller.js";

const router = Router();

router.post("/add", isAuthenticated, createNote);

export default router;
