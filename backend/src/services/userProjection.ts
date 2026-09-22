import type { UserRole } from "../generated/prisma/client";

/**
 * The projection every endpoint that returns a user to its own owner shares.
 *
 * Kept in its own module so `authService` (which reads it on `/auth/me`) and
 * `userService` (which returns it from a profile update) agree by construction:
 * the shape a member sees cannot change depending on which endpoint answered.
 *
 * `passwordHash` is absent by definition — it is a deny-by-default whitelist,
 * so a column added to the model later never leaks into a response on its own.
 */
export interface PublicUserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  birthDate: Date | null;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
}

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  phone: true,
  birthDate: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} as const;
