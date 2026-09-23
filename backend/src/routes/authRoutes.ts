import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/authController";
import { authenticate } from "../middleware/authenticate";
import { sanitizeBody } from "../middleware/sanitizeBody";

const router = Router();

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;

const AUTH_RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? `${DEFAULT_RATE_LIMIT_WINDOW_MS}`,
  10,
);

const AUTH_RATE_LIMIT_MAX_ATTEMPTS = Number.parseInt(
  process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS ?? `${DEFAULT_RATE_LIMIT_MAX_ATTEMPTS}`,
  10,
);

const RATE_LIMIT_OPTIONS = {
  standardHeaders: true,
  legacyHeaders: false,
} as const;

/**
 * Credential endpoints are the cheapest thing to brute-force, so they share the
 * stricter auth budget (5 attempts / 15 min / IP by default).
 */
const authLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  keyGenerator: (req) => req.ip ?? "unknown",
});

/**
 * Session renewal gets its own budget rather than sharing the credential one.
 * A browser renews far more often than it signs in, and since the session now
 * lives in a cookie, every renewal used to eat into the five sign-in attempts a
 * visitor is allowed — enough to lock someone out of their own login page.
 */
const REFRESH_RATE_LIMIT_MULTIPLIER = 12;

const refreshLimiter = rateLimit({
  ...RATE_LIMIT_OPTIONS,
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_ATTEMPTS * REFRESH_RATE_LIMIT_MULTIPLIER,
  keyGenerator: (req) => req.ip ?? "unknown",
});

router.post("/register", authLimiter, sanitizeBody, authController.register);
router.post("/login", authLimiter, sanitizeBody, authController.login);
router.post("/refresh", refreshLimiter, sanitizeBody, authController.refreshToken);
router.post("/forgot-password", authLimiter, sanitizeBody, authController.forgotPassword);
router.post("/reset-password", authLimiter, sanitizeBody, authController.resetPassword);

// Shares the credential budget: the body carries a 6-digit code, which is exactly
// the kind of short secret worth brute-forcing.
router.post("/verify-email", authLimiter, sanitizeBody, authController.verifyEmail);

// Not rate limited: a throttled sign-out would leave the browser holding a live
// session, which is exactly what this endpoint exists to prevent. The work is a
// single indexed delete, and the request body only ever carries a credential.
router.post("/logout", sanitizeBody, authController.logout);

// Not rate limited: the endpoint is gated by a short-lived access token, and
// anonymous visitors now reach it too (their request simply resolves to a 401).
router.get("/me", authenticate, authController.getMe);

export default router;
