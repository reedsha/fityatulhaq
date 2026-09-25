/**
 * Single source of truth for the API's mount points.
 *
 * `src/index.ts` mounts the routers with these values, and the session cookie
 * config derives the refresh cookie's `Path` from `AUTH_ROUTE_PREFIX` — so a
 * change here can never leave the cookie scoped to a path nobody serves.
 */

export const API_V1_PREFIX = "/api/v1";

export const AUTH_ROUTE_PREFIX = `${API_V1_PREFIX}/auth`;

export const USER_ROUTE_PREFIX = `${API_V1_PREFIX}/users`;

export const ASSETS_ROUTE_PREFIX = `${API_V1_PREFIX}/assets`;

export const WEBBOARD_ROUTE_PREFIX = `${API_V1_PREFIX}/webboard`;

export const NOTIFICATION_ROUTE_PREFIX = `${API_V1_PREFIX}/notifications`;
