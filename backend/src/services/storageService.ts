import { FITYATULHAQ_ASSETS, supabaseAdmin } from "../config/supabase";
import {
  createAppError,
  isApplicationError,
  toErrorMessage,
} from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";

/**
 * Bucket shared by every member-facing asset. Resolved from
 * `SUPABASE_STORAGE_BUCKET` in `config/supabase.ts` so a single env change moves
 * both this module and the rest of the app.
 *
 * The bucket must be marked *public* in the Supabase dashboard
 * (Storage → assets → Public bucket): the URLs below are handed to
 * the browser directly, and a private bucket would answer them with a 400.
 */
export const AVATAR_BUCKET = FITYATULHAQ_ASSETS;

/** Folder inside the bucket that holds avatars. */
export const AVATAR_FOLDER = "avatars";

/**
 * Prefix every stored avatar URL carries. Matching on the full prefix — rather
 * than just the filename — is what proves a stored URL points at an object this
 * module is allowed to delete.
 */
const OBJECT_URL_MARKER = `/storage/v1/object/public/${AVATAR_BUCKET}/${AVATAR_FOLDER}/`;

/** Object key inside the bucket, e.g. `avatars/8f3c….webp`. */
export function avatarObjectPath(fileName: string): string {
  return `${AVATAR_FOLDER}/${fileName}`;
}

/**
 * Public URL for an object in the bucket.
 *
 * Delegated to the SDK rather than formatted by hand so a change to the project
 * URL or storage API version cannot leave the database holding dead links.
 */
export function generatePublicUrl(fileName: string): string {
  const { data } = supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(avatarObjectPath(fileName));

  return data.publicUrl;
}

/**
 * Recovers the object key from a previously stored avatar URL, or `null` when
 * the URL is empty or does not belong to this bucket/folder (an externally
 * hosted avatar, or a hand-edited row). Never throws.
 */
export function extractAvatarFileName(avatarUrl: string | null): string | null {
  if (avatarUrl === null) {
    return null;
  }

  const trimmed = avatarUrl.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const markerIndex = trimmed.indexOf(OBJECT_URL_MARKER);

  if (markerIndex === -1) {
    logger.warn(
      `[AVATAR_DELETE_SKIPPED] Stored avatar URL is not a ${AVATAR_BUCKET} object: ${trimmed}`,
    );
    return null;
  }

  const rawName = trimmed.slice(markerIndex + OBJECT_URL_MARKER.length).split("?")[0] ?? "";
  let decoded: string;

  try {
    decoded = decodeURIComponent(rawName);
  } catch (error) {
    logger.warn(`[AVATAR_DELETE_SKIPPED] Undecodable object name: ${toErrorMessage(error)}`);
    return null;
  }

  // A single path segment with no traversal: anything else is rejected rather
  // than handed to the storage API.
  if (decoded.length === 0 || decoded.includes("/") || decoded.includes("..")) {
    logger.warn(`[AVATAR_DELETE_SKIPPED] Refusing to delete suspicious object name: ${decoded}`);
    return null;
  }

  return decoded;
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { message?: unknown; statusCode?: unknown };
  const statusCode = typeof candidate.statusCode === "string" ? candidate.statusCode : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return statusCode === "404" || message.includes("not found");
}

/**
 * Uploads an avatar and returns its public URL.
 *
 * This is the one storage call that fails loudly: a profile update that claims
 * to have stored an image which is not there would be worse than an error, so a
 * failed upload surfaces as `UPLOAD_FAILED`.
 */
export async function uploadAvatar(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const path = avatarObjectPath(fileName);

  try {
    // `upsert: false` because the filename is a fresh UUID: an existing object
    // under that key can only mean something is wrong, and silently overwriting
    // it would destroy another member's avatar.
    const { error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(path, fileBuffer, { contentType: mimeType, upsert: false });

    if (error !== null) {
      logger.error(`[AVATAR_UPLOAD_FAILED] ${path}: ${error.message}`);
      throw createAppError("UPLOAD_FAILED", "Avatar upload failed", 500);
    }

    logger.info(`[AVATAR_UPLOADED] ${path} (${fileBuffer.length} bytes, ${mimeType})`);

    return generatePublicUrl(fileName);
  } catch (error) {
    if (isApplicationError(error)) {
      throw error;
    }

    logger.error(`[AVATAR_UPLOAD_FAILED] ${path}: ${toErrorMessage(error)}`);

    throw createAppError("UPLOAD_FAILED", "Avatar upload failed", 500);
  }
}

/**
 * Removes the member's previous avatar.
 *
 * Deliberately non-fatal: the new avatar is already in place by the time this
 * runs, and failing the request because a soon-to-be-orphaned object survived
 * would be the worst of both outcomes. Anything left behind is reclaimed by the
 * separate cleanup pass, so every branch here logs and returns.
 */
export async function deleteOldAvatar(oldAvatarUrl: string | null): Promise<void> {
  const fileName = extractAvatarFileName(oldAvatarUrl);

  if (fileName === null) {
    return;
  }

  const path = avatarObjectPath(fileName);

  try {
    const { data, error } = await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([path]);

    if (error !== null) {
      if (isNotFoundError(error)) {
        logger.warn(`[AVATAR_DELETE_SKIPPED] ${path} was already absent: ${error.message}`);
        return;
      }

      logger.error(`[AVATAR_DELETE_FAILED] ${path}: ${error.message}`);
      return;
    }

    logger.info(`[AVATAR_DELETED] ${path} (${data.length} object(s) removed)`);
  } catch (error) {
    logger.error(`[AVATAR_DELETE_FAILED] ${path}: ${toErrorMessage(error)}`);
  }
}
