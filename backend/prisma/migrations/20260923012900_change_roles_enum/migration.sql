-- Rename old enum type
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

-- Create new enum with PRD §6.2 roles
CREATE TYPE "UserRole_new" AS ENUM ('GUEST', 'MEMBER', 'CONTENT_MODERATOR');

-- Temporarily allow text, migrate data, then switch column type
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;

-- Cast to new enum (now safe because source is text)
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING "role"::"UserRole_new";

-- Drop old enum, rename new one
DROP TYPE "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Set default for future inserts (per PRD: register → MEMBER; GUEST is base role)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'GUEST';
