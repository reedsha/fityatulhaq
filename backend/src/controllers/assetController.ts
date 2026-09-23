import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { createAppError, formatAuthResponse, toHttpError } from "../middleware/errorFormatter";
import * as signUrlService from "../services/signUrlService";
import { parseBody } from "../utils/validation";

/**
 * The only field the signing endpoint accepts.
 *
 * Bounded because the id is interpolated into an upstream URL: an unbounded
 * string is a free way to make this API build an arbitrarily long request.
 */
export const signAssetSchema = z.object({
  assetId: z
    .string()
    .trim()
    .min(1, "assetId is required")
    .max(200, "assetId maximum 200 characters"),
});

/**
 * `POST /assets/sign` — exchanges the caller's session for a short-lived asset
 * URL.
 *
 * The caller's identity comes from the verified token and is forwarded to Web 2,
 * so the decision to grant access stays auditable on the side that owns the
 * file. It is never read from the request body.
 */
export async function signAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id ?? "";

    if (userId.length === 0) {
      throw createAppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { assetId } = parseBody(signAssetSchema, req.body);
    const signed = await signUrlService.getSignedAssetUrl(assetId, userId);

    res.status(200).json(formatAuthResponse(signed));
  } catch (error) {
    next(
      toHttpError(error, { code: "ASSET_SIGN_FAILED", message: "Unable to sign the asset URL" }),
    );
  }
}
