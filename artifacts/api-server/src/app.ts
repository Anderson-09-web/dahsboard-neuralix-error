import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Build allowed origins list:
// 1. APP_URL env var takes highest priority (fixed production URL, e.g. Vercel)
// 2. REPLIT_DOMAINS covers all active Replit dev/preview domains (comma-separated)
// 3. localhost fallbacks for local development
const allowedOrigins: string[] = [];

if (process.env.APP_URL) {
  // Support comma-separated list in APP_URL too
  process.env.APP_URL.split(",").forEach((u) => {
    const url = u.trim().replace(/\/+$/, "");
    if (url) allowedOrigins.push(url);
  });
}

if (process.env.REPLIT_DOMAINS) {
  process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
    const domain = d.trim();
    if (domain) allowedOrigins.push(`https://${domain}`);
  });
}

allowedOrigins.push("http://localhost:5173", "http://localhost:23133", "http://localhost:80");

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development, allow any origin to avoid blocking during URL changes
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
