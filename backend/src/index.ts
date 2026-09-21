import "dotenv/config";

import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { disconnectPrisma, initPrisma } from "./config/database";
// Imported for its side effect: booting fails loudly if the privileged Supabase
// key is missing, and the client is ready for the Phase 2 storage work.
import "./config/supabase";
import { errorHandler, toErrorMessage } from "./middleware/errorFormatter";
import { logger } from "./middleware/logger";
import { sanitizeBody } from "./middleware/sanitizeBody";
import authRoutes from "./routes/authRoutes";

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

const PORT = resolvePort();

const app: Express = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: resolveAllowedOrigins(), credentials: true }));
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

app.use("/api/v1/auth", authRoutes);

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
  const server = app.listen(PORT, (): void => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  registerShutdownHandlers(server);
}

initPrisma()
  .then((): void => {
    startServer();
  })
  .catch((error: unknown): void => {
    logger.error(`Failed to start the API: ${toErrorMessage(error)}`);
    process.exit(1);
  });