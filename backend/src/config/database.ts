import { PrismaPg } from "@prisma/adapter-pg";

// Entry point of the generated Prisma 7 client (`src/generated/prisma/client.ts`).
import { PrismaClient } from "../generated/prisma/client";

/**
 * Prisma 7 has no bundled query engine: the client talks to PostgreSQL through
 * a driver adapter (`@prisma/adapter-pg`), so `datasourceUrl` is not a valid
 * client option any more — the connection string belongs to the adapter.
 */
type GlobalWithPrisma = typeof globalThis & { _prisma?: PrismaClient };

const globalForPrisma = globalThis as GlobalWithPrisma;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("MISSING_ENV_VAR: DATABASE_URL");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

/**
 * Single client instance for the whole process.
 */
export const prisma: PrismaClient = globalForPrisma._prisma ?? createPrismaClient();

// `ts-node-dev --respawn` re-evaluates this module on every reload; caching the
// instance on globalThis stops each reload from opening a new connection pool.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = prisma;
}

export async function initPrisma(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error("[prisma] Failed to connect to the database:", error);
    throw error;
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("[prisma] Failed to disconnect from the database:", error);
    throw error;
  }
}