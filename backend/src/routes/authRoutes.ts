import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/authController";
import { authenticate } from "../middleware/authenticate";
import { sanitizeBody } from "../middleware/sanitizeBody";

const router = Router();

const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;

/**
 * Credential endpoints are the cheapest thing to brute-force, so they share the
 * stricter auth budget (5 attempts / 15 min / IP by default).
 */
const authLimiter = rateLimit({
  windowMs: Number.parseInt(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? `${DEFAULT_RATE_LIMIT_WINDOW_MS}`,
    10,
  ),
  max: Number.parseInt(
    process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS ?? `${DEFAULT_RATE_LIMIT_MAX_ATTEMPTS}`,
    10,
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
});

router.post("/register", authLimiter, sanitizeBody, authController.register);
router.post("/login", authLimiter, sanitizeBody, authController.login);
router.post("/refresh", authLimiter, sanitizeBody, authController.refreshToken);
router.post("/forgot-password", authLimiter, sanitizeBody, authController.forgotPassword);
router.post("/reset-password", authLimiter, sanitizeBody, authController.resetPassword);

// Not rate limited: the endpoint is already gated by a short-lived access token.
router.get("/me", authenticate, authController.getMe);

export default router;