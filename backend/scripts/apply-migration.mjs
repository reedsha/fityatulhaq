import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (postgres doesn't auto-load)
const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
const envMap = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    envMap[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

if (!envMap.DIRECT_URL && !envMap.DATABASE_URL) {
  console.error("No DATABASE_URL or DIRECT_URL found in .env");
  process.exit(1);
}

const connectionUrl = envMap.DIRECT_URL || envMap.DATABASE_URL;
const sqlTemplate = readFileSync(
  resolve(__dirname, "../prisma/migrations/20260923012900_change_roles_enum/migration.sql"),
  "utf-8"
);

console.log("[MIGRATE] Applying role enum migration...");

const sql = postgres(connectionUrl, {
  max: 1,
  onnotice: () => {}, // silence NOTICE messages
});

try {
  await sql.unsafe(sqlTemplate);
  console.log("[OK] Role enum migration applied successfully.");
} catch (err) {
  console.error("[ERROR]", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
