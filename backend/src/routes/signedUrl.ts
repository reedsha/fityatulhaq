import { Router } from "express";
import rateLimit from "express-rate-limit";

import { signAsset } from "../controllers/assetController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

const DEFAULT_SIGN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Far looser than the credential budget, because opening documents is ordinary
 * reading rather than a brute-force surface.
 */
const DEFAULT_SIGN_RATE_LIMIT_MAX_ATTEMPTS = 100;

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const SIGN_RATE_LIMIT_WINDOW_MS = readPositiveInt(
  process.env.ASSET_SIGN_RATE_LIMIT_WINDOW_MS,
  DEFAULT_SIGN_RATE_LIMIT_WINDOW_MS,
);

const SIGN_RATE_LIMIT_MAX_ATTEMPTS = readPositiveInt(
  process.env.ASSET_SIGN_RATE_LIMIT_MAX_ATTEMPTS,
  DEFAULT_SIGN_RATE_LIMIT_MAX_ATTEMPTS,
);

/**
 * Asset downloads get their own budget rather than borrowing the credential one.
 *
 * `AUTH_RATE_LIMIT_*` in `authRoutes.ts` are local, unexported constants, so
 * reusing them would mean exporting them — and sharing the budget is worse than
 * it looks: two document opens would consume the five sign-in attempts a visitor
 * is allowed, locking a member out of the login page for reading a PDF.
 */
const signLimiter = rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: SIGN_RATE_LIMIT_WINDOW_MS,
  max: SIGN_RATE_LIMIT_MAX_ATTEMPTS,
  keyGenerator: (req) => req.ip ?? "unknown",
});

// Limited before authenticating, matching `authRoutes`: the cheap gate rejects
// floods before any token verification work happens.
router.post("/sign", signLimiter, authenticate, signAsset);

export default router;
