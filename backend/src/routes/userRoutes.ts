import { Router } from "express";

import * as userController from "../controllers/userController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 * Every route on this router acts on the caller's own account, so the token is
 * required as a property of the router rather than route by route — a route
 * added later cannot accidentally be left unauthenticated.
 *
 * The controller additionally checks that `:userId` matches the token's subject
 * and answers 403 when it does not, so the parameter is never trusted.
 */
router.use(authenticate);

router.put("/:userId/profile", userController.updateProfile);

router.post(
  "/:userId/avatar",
  userController.uploadAvatarMiddleware,
  userController.uploadAvatar,
);

export default router;
