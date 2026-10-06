import "dotenv/config";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { disconnectPrisma, initPrisma } from "./config/database";
import {
  ASSETS_ROUTE_PREFIX,
  AUTH_ROUTE_PREFIX,
  NOTIFICATION_ROUTE_PREFIX,
  USER_ROUTE_PREFIX,
  WEBBOARD_ROUTE_PREFIX,
} from "./config/routePrefix";
// Imported for its side effect: booting fails loudly if the privileged Supabase
// key is missing, and the client is ready for the Phase 2 storage work.
import "./config/supabase";
import { errorHandler, toErrorMessage } from "./middleware/errorFormatter";
import { logger } from "./middleware/logger";
import { sanitizeBody } from "./middleware/sanitizeBody";
import authRoutes from "./routes/authRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import signedUrlRoutes from "./routes/signedUrl";
import userRoutes from "./routes/userRoutes";
import webboardRoutes from "./routes/webboardRoutes";

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BACKEND_API_SECRET",
] as const;

const DEFAULT_PORT = 4000;
const DEFAULT_ALLOWED_ORIGIN = "http://localhost:3000";

// Fail fast: never boot a half-configured API.
for (const variableName of REQUIRED_ENV_VARS) {
  if (!process.env[variableName]) {
    throw new Error(`MISSING_ENV_VAR: ${variableName}`);
  }
}

function resolvePort(): number {
  const rawPort = process.env.PORT;
  const port = Number.parseInt(rawPort ?? `${DEFAULT_PORT}`, 10);

  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
}

function resolveAllowedOrigins(): string[] {
  const configured = process.env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGIN;

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Development serves the web app from whichever port is free: the dev server
 * climbs 3000, 3001, 3002 … whenever older ones are still running. A fixed
 * allowlist therefore breaks sign-in every time the port drifts, so loopback
 * origins are accepted outside production and the configured allowlist stays
 * authoritative in production.
 */
const LOOPBACK_ORIGIN_PATTERN = /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+$/;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const allowedOrigins = resolveAllowedOrigins();

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return !IS_PRODUCTION && LOOPBACK_ORIGIN_PATTERN.test(origin);
}

/**
 * An origin callback rather than a static list, so a rejected origin can be
 * logged. Without that log the browser only reports a bare "no
 * Access-Control-Allow-Origin header" and the real cause never reaches the
 * server.
 */
function resolveCorsOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void {
  // No Origin at all means a non-browser caller — curl, the smoke test, or
  // server-to-server traffic. CORS is a browser-only policy, so there is nothing
  // to decide here.
  if (origin === undefined || origin.trim() === "" || isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  logger.warn(
    `[CORS_REJECTED] ${origin} is not allowed. Add it to CORS_ALLOWED_ORIGINS to permit it.`,
  );

  callback(null, false);
}

const PORT = resolvePort();

const app: Express = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: resolveCorsOrigin, credentials: true }));

// The browser session travels in httpOnly cookies, so the jar has to be parsed
// before any route runs: `authenticate` reads `req.cookies`, and the auth
// controllers write the pair back with `res.cookie`.
app.use(cookieParser());
app.use(
  morgan("combined", {
    stream: {
      write: (message: string): void => {
        logger.info(message.trim());
      },
    },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(sanitizeBody);

app.use(AUTH_ROUTE_PREFIX, authRoutes);
app.use(USER_ROUTE_PREFIX, userRoutes);
app.use(ASSETS_ROUTE_PREFIX, signedUrlRoutes);
app.use(WEBBOARD_ROUTE_PREFIX, webboardRoutes);
app.use(NOTIFICATION_ROUTE_PREFIX, notificationRoutes);

app.use("*", (_req: express.Request, res: express.Response): void => {
  res.status(404).json({
    success: false,
    error: { code: "ROUTE_NOT_FOUND", message: "Endpoint not found" },
  });
});

// Must stay last so every failure leaves through the same envelope.
app.use(errorHandler);

function registerShutdownHandlers(server: ReturnType<Express["listen"]>): void {
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received. Shutting down...`);

    server.close((): void => {
      disconnectPrisma()
        .then((): void => {
          logger.info("Database connection closed");
          process.exit(0);
        })
        .catch((error: unknown): void => {
          logger.error(`Failed to disconnect from the database: ${toErrorMessage(error)}`);
          process.exit(1);
        });
    });
  };

  process.on("SIGTERM", (): void => shutdown("SIGTERM"));
  process.on("SIGINT", (): void => shutdown("SIGINT"));
}

function startServer(): void {
  const server = app.listen(PORT, "0.0.0.0", (): void => {
    logger.info(`Server running on http://0.0.0.0:${PORT} (port ${PORT})`);
  });

  registerShutdownHandlers(server);
}

// Start the HTTP server immediately so Render detects the open port without delay.
startServer();

initPrisma()
  .then((): void => {
    logger.info("Database connection established successfully");
  })
  .catch((error: unknown): void => {
    logger.error(`Database connection failed: ${toErrorMessage(error)}`);
  });