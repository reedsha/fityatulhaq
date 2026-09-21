import path from "node:path";

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const LOG_DIR = process.env.LOG_DIR ?? "./logs";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "debug";

/** `[timestamp] [level] message {json}` */
const logFormat = winston.format.printf(
  (info: winston.Logform.TransformableInfo): string => {
    const { timestamp, level, message, ...meta } = info;
    const metaJson = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";

    return `[${String(timestamp)}] [${level}] ${String(message)}${metaJson}`;
  },
);

const consoleTransport = new winston.transports.Console({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    logFormat,
  ),
});

// Rotates daily (and once the file passes 10 MB), keeping the 7 most recent files.
const fileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: LOG_LEVEL,
  maxSize: "10m",
  maxFiles: 7,
  format: winston.format.combine(winston.format.timestamp(), logFormat),
});

/**
 * Application-wide logger. Formats are declared per transport so the console
 * stays colourised while the file transport keeps writing plain text.
 */
export const logger: winston.Logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: "fityatulhaq-backend" },
  transports: [consoleTransport, fileTransport],
});