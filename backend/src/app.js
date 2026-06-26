import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { applicationRouter } from "./routes/applicationRoutes.js";
import { jobRouter } from "./routes/jobRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { savedJobsRouter } from "./routes/savedJobsRoutes.js";
import { ApiError } from "./utils/ApiError.js";
import { sendSuccess } from "./utils/ApiResponse.js";

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed =
        env.allowedOrigins.includes(origin) ||
        /^https:\/\/[a-z0-9-]+-saudiacareers\.vercel\.app$/.test(origin) ||
        /^https:\/\/saudiacareers-frontend[a-z0-9-]*\.vercel\.app$/.test(origin);
      if (allowed) return callback(null, true);
      return callback(new ApiError(403, "Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) =>
  sendSuccess(res, {
    message: "SaudiaCareers API is healthy",
    data: { environment: env.NODE_ENV },
  }),
);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/saved-jobs", savedJobsRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
