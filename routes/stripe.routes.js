import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { postConfirmPayment } from "../controllers/stripe.controller.js";

const router = Router();

router.post("/confirm", isAuthenticated, postConfirmPayment);

export default router;
