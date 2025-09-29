import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import userRoute from "./routes/user.route.js";
import instructorRoute from "./routes/instructor.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
//TODO: Change this to use stripe
// import razorpayRoute from "./routes/razorpay.routes.js";
import healthRoute from "./routes/health.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

//#region Constants
const app = express();
const allowedOrigins = process.env.CLIENT_URL.split(",");
//#endregion

//#region Middlewares
// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// Security Middleware
app.use(helmet()); // Set security HTTP headers
// app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
// app.use(xss()); // Data sanitization against XSS
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use("/api", limiter); // Apply rate limiting to all routes

// Logging Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body Parser Middleware
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  }),
);
//#endregion

//#region API Routes
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/instructor", instructorRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/stripe", stripeRoutes);
// app.use("/api/v1/razorpay", razorpayRoute);
app.use("/health", healthRoute);
//#endregion

//#region 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});
//#endregion;

//#region Global Error Handler.
app.use(errorHandler);
// app.use((err, req, res, next) => {
//   console.error(err);
//   return res.status(err.statusCode || 500).json({
//     status: "error",
//     message: err.message || "Internal server error",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });
//#endregion

export { app };
