import type { AuthUser } from "@/context/AuthContext";
import { request, requestMultipart } from "@/lib/api";

/**
 * Profile & avatar transport.
 *
 * Thin by design: authentication, the 401/session-expiry handling and envelope
 * unwrapping all live in `lib/api`, so this module only names the endpoints and
 * the shapes they speak.
 */

/** Field name the backend reads the uploaded image from (`AVATAR_FIELD_NAME`). */
export const AVATAR_FIELD_NAME = "avatar";

/**
 * Partial update. An omitted key is left untouched, and an empty string clears
 * an optional column — matching the PATCH semantics of the route.
 */
export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  birthDate?: string;
}

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl: string;
}

function userEndpoint(userId: string, suffix: string): string {
  return `/users/${encodeURIComponent(userId)}${suffix}`;
}

/**
 * `PUT /users/:userId/profile` — saves the editable fields.
 *
 * The backend answers with the updated profile projection, which is also what
 * `GET /auth/me` returns, so the caller can refresh the session context with it
 * without a second round trip.
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfilePayload,
): Promise<AuthUser> {
  return request<AuthUser>(userEndpoint(userId, "/profile"), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * `POST /users/:userId/avatar` — replaces the member's photo.
 *
 * The file is sent as multipart/form-data, which is why this goes through
 * `requestMultipart` rather than the JSON `request`.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<AvatarUploadResult> {
  const formData = new FormData();
  formData.append(AVATAR_FIELD_NAME, file);

  const result = await requestMultipart<{ avatarUrl: string }>(
    userEndpoint(userId, "/avatar"),
    formData,
  );

  return { success: true, avatarUrl: result.avatarUrl };
}
