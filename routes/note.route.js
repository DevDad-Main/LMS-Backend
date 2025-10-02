import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/add", isAuthenticated);
