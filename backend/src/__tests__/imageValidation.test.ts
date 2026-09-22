/**
 * Phase 3 image-validation & storage-key smoke test — a plain Node script
 * (no Jest/Mocha/sinon, matching `smtp.test.ts`).
 *
 *   1. Run the test:  npx ts-node src/__tests__/imageValidation.test.ts
 *
 * Runs entirely in-process. Images are built byte-by-byte so the test does not
 * depend on any fixture files, and nothing is ever sent to Supabase: the
 * storage checks only cover the pure helpers (object key + URL round-tripping).
 *
 * `SUPABASE_*` is pinned below before `../services/storageService` is loaded,
 * because it reaches `config/supabase`, which refuses to load without a service
 * role key. The values are deliberately fake — no client call is made.
 */

import { isApplicationError } from "../middleware/errorFormatter";

process.env.SUPABASE_URL = "https://project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests";
process.env.SUPABASE_STORAGE_BUCKET = "assets";

let failures = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${name}`);
    return;
  }

  console.error(`FAIL: ${name}`);
  failures += 1;
}

/** Catches a synchronous throw and reports the error contract it carried. */
function captureErrorCode(call: () => unknown): string {
  try {
    call();
    return "";
  } catch (error) {
    return isApplicationError(error) ? error.code : "";
  }
}

function captureErrorMessage(call: () => unknown): string {
  try {
    call();
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

// ------------------------------------------------------------
// Image fixtures — the smallest byte sequences that carry a size
// ------------------------------------------------------------

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Signature, then an IHDR chunk holding the size, then the 5 IHDR fields. */
function buildPng(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(33);

  Buffer.from(PNG_SIGNATURE).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8); // chunk length
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8; // bit depth
  buffer[25] = 6; // colour type: RGBA

  return buffer;
}

/** Header plus the logical screen descriptor, which holds the size. */
function buildGif(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(13);

  buffer.write("GIF89a", 0, "ascii");
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);

  return buffer;
}

/** SOI, one APP0 segment to walk past, then SOF0 carrying the size. */
function buildJpeg(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(18);

  buffer[0] = 0xff;
  buffer[1] = 0xd8; // SOI
  buffer[2] = 0xff;
  buffer[3] = 0xe0; // APP0
  buffer.writeUInt16BE(4, 4); // segment length (counts itself)
  buffer.write("HI", 6, "ascii");
  buffer[8] = 0xff;
  buffer[9] = 0xc0; // SOF0
  buffer.writeUInt16BE(11, 10);
  buffer[12] = 8; // precision
  buffer.writeUInt16BE(height, 13);
  buffer.writeUInt16BE(width, 15);
  buffer[17] = 1; // component count

  return buffer;
}

/** RIFF/WEBP container whose VP8X chunk stores the canvas size minus one. */
function buildWebpExtended(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(30);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8X", 12, "ascii");
  buffer.writeUInt32LE(10, 16); // chunk size
  buffer.writeUIntLE(width - 1, 24, 3);
  buffer.writeUIntLE(height - 1, 27, 3);

  return buffer;
}

/**
 * Lossless WebP, whose size is bit-packed rather than byte-aligned — the case
 * a naive parser gets wrong.
 */
function buildWebpLossless(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(25);
  const packedWidth = width - 1;
  const packedHeight = height - 1;

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WEBP", 8, "ascii");
  buffer.write("VP8L", 12, "ascii");
  buffer.writeUInt32LE(5, 16); // chunk size
  buffer[20] = 0x2f; // lossless signature
  buffer[21] = packedWidth & 0xff;
  buffer[22] = (((packedWidth >> 8) & 0x3f) | ((packedHeight & 0x03) << 6)) & 0xff;
  buffer[23] = (packedHeight >> 2) & 0xff;
  buffer[24] = (packedHeight >> 10) & 0x0f;

  return buffer;
}

const UUID_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp)$/;

async function run(): Promise<void> {
  const validator = await import("../utils/imageValidator");
  const storage = await import("../services/storageService");
  const profile = await import("../utils/profile");

  const {
    MAX_AVATAR_BYTES,
    detectImageMimeType,
    generateAvatarFilename,
    sanitizeFileName,
    validateImageFile,
  } = validator;

  // ----------------------------------------------------------
  // Format sniffing
  // ----------------------------------------------------------

  check("PNG signature is detected", detectImageMimeType(buildPng(10, 10)) === "image/png");
  check("JPEG signature is detected", detectImageMimeType(buildJpeg(10, 10)) === "image/jpeg");
  check("GIF signature is detected", detectImageMimeType(buildGif(10, 10)) === "image/gif");
  check(
    "WebP signature is detected",
    detectImageMimeType(buildWebpExtended(10, 10)) === "image/webp",
  );
  check("plain text is not an image", detectImageMimeType(Buffer.from("hello world")) === null);
  check("an empty buffer is not an image", detectImageMimeType(Buffer.alloc(0)) === null);
  check(
    "a truncated PNG signature is rejected",
    detectImageMimeType(Buffer.from(PNG_SIGNATURE.slice(0, 7))) === null,
  );
  check(
    "a PNG with a script appended is still recognised as a polyglot image",
    detectImageMimeType(
      Buffer.concat([buildPng(10, 10), Buffer.from("<script>alert(1)</script>")]),
    ) === "image/png",
  );

  // ----------------------------------------------------------
  // Accepted images
  // ----------------------------------------------------------

  const png = await validateImageFile(buildPng(512, 512));
  check("a 512x512 PNG is accepted", png.isValid);
  check("the PNG MIME type is reported", png.mimeType === "image/png");
  check("the PNG width is read from the header", png.width === 512);
  check("the PNG height is read from the header", png.height === 512);
  check("the reported file size is the buffer length", png.fileSize === buildPng(512, 512).length);

  const jpeg = await validateImageFile(buildJpeg(800, 600));
  check("a 800x600 JPEG is accepted", jpeg.isValid && jpeg.width === 800 && jpeg.height === 600);
  check("the JPEG MIME type is reported", jpeg.mimeType === "image/jpeg");

  const gif = await validateImageFile(buildGif(120, 240));
  check("a 120x240 GIF is accepted", gif.isValid && gif.width === 120 && gif.height === 240);
  check("the GIF MIME type is reported", gif.mimeType === "image/gif");

  const webp = await validateImageFile(buildWebpExtended(256, 128));
  check("a 256x128 extended WebP is accepted", webp.isValid && webp.width === 256 && webp.height === 128);
  check("the WebP MIME type is reported", webp.mimeType === "image/webp");

  const webpLossless = await validateImageFile(buildWebpLossless(1024, 512));
  check(
    "a 1024x512 lossless WebP is accepted",
    webpLossless.isValid && webpLossless.width === 1024 && webpLossless.height === 512,
  );

  // ----------------------------------------------------------
  // Bounds
  // ----------------------------------------------------------

  const atMinimum = await validateImageFile(buildPng(100, 100));
  check("the 100px minimum is inclusive", atMinimum.isValid);

  const atMaximum = await validateImageFile(buildPng(2048, 2048));
  check("the 2048px maximum is inclusive", atMaximum.isValid);

  const tooSmall = await validateImageFile(buildPng(99, 512));
  check("a 99px-wide PNG is rejected", !tooSmall.isValid);
  check("a rejected image reports no dimensions", tooSmall.width === 0 && tooSmall.height === 0);

  const tooLarge = await validateImageFile(buildPng(2049, 512));
  check("a 2049px-wide PNG is rejected", !tooLarge.isValid);

  const tooTall = await validateImageFile(buildPng(512, 3000));
  check("a 3000px-tall PNG is rejected", !tooTall.isValid);

  const empty = await validateImageFile(Buffer.alloc(0));
  check("an empty upload is rejected", !empty.isValid);

  // ----------------------------------------------------------
  // Malformed input never throws
  // ----------------------------------------------------------

  const randomBytes = Buffer.alloc(4096, 0x5a);
  const randomResult = await validateImageFile(randomBytes);
  check("random bytes are rejected without throwing", !randomResult.isValid);
  check(
    "random bytes report the buffer length",
    randomResult.fileSize === 4096 && randomResult.mimeType === "",
  );

  const headerOnly = Buffer.concat([Buffer.from(PNG_SIGNATURE), Buffer.alloc(8)]);
  const headerOnlyResult = await validateImageFile(headerOnly);
  check("a PNG whose IHDR chunk is missing is rejected", !headerOnlyResult.isValid);

  const oversized = Buffer.alloc(MAX_AVATAR_BYTES + 1);
  buildPng(512, 512).copy(oversized, 0);
  const oversizedResult = await validateImageFile(oversized);
  check("an upload over 5 MB is rejected even with valid magic numbers", !oversizedResult.isValid);

  // ----------------------------------------------------------
  // Filenames
  // ----------------------------------------------------------

  check("a JPEG filename gets a .jpg extension", generateAvatarFilename("image/jpeg").endsWith(".jpg"));
  check("a PNG filename gets a .png extension", generateAvatarFilename("image/png").endsWith(".png"));
  check("a GIF filename gets a .gif extension", generateAvatarFilename("image/gif").endsWith(".gif"));
  check("a WebP filename gets a .webp extension", generateAvatarFilename("image/webp").endsWith(".webp"));
  check(
    "generated filenames are UUID-based",
    UUID_FILENAME_PATTERN.test(generateAvatarFilename("image/png")),
  );

  const generated = new Set<string>();
  for (let index = 0; index < 500; index += 1) {
    generated.add(generateAvatarFilename("image/png"));
  }
  check("500 generated filenames are all unique", generated.size === 500);

  check(
    "an unsupported MIME type is refused",
    captureErrorMessage(() => generateAvatarFilename("image/tiff")).length > 0,
  );

  check("a missing filename falls back to a label", sanitizeFileName() === "unnamed");
  check("an empty filename falls back to a label", sanitizeFileName("   ") === "unnamed");
  check("a plain filename is preserved", sanitizeFileName("holiday.png") === "holiday.png");
  check(
    "path traversal is stripped",
    sanitizeFileName("../../etc/passwd") === "etcpasswd",
  );
  check(
    "a Windows path is stripped of separators and drive colons",
    sanitizeFileName("C:\\Users\\me\\avatar.png") === "CUsersmeavatar.png",
  );
  check(
    "angle brackets are stripped",
    sanitizeFileName("<script>.png") === "script.png",
  );
  check(
    "control characters are stripped",
    sanitizeFileName("ava\u0000tar\u001f.png") === "avatar.png",
  );
  check("long filenames are truncated to 50 characters", sanitizeFileName("a".repeat(120)).length === 50);

  // ----------------------------------------------------------
  // Storage object keys (no network)
  // ----------------------------------------------------------

  check("objects live under the avatars folder", storage.avatarObjectPath("x.png") === "avatars/x.png");

  const publicUrl = storage.generatePublicUrl("abc123.png");
  check("a public URL points at the assets bucket", publicUrl.includes("/assets/avatars/"));
  check("a public URL carries the object name", publicUrl.endsWith("/avatars/abc123.png"));
  check("a public URL round-trips back to the object name", storage.extractAvatarFileName(publicUrl) === "abc123.png");

  check("a null avatar URL yields no object name", storage.extractAvatarFileName(null) === null);
  check("an empty avatar URL yields no object name", storage.extractAvatarFileName("   ") === null);
  check(
    "a foreign avatar URL is not treated as ours",
    storage.extractAvatarFileName("https://example.com/storage/v1/object/public/other/avatars/x.png") ===
      null,
  );
  check(
    "a traversal attempt in a stored URL is refused",
    storage.extractAvatarFileName(`${publicUrl.slice(0, publicUrl.lastIndexOf("/") + 1)}../etc/passwd`) ===
      null,
  );
  check(
    "a query string is ignored when recovering the object name",
    storage.extractAvatarFileName("/storage/v1/object/public/assets/avatars/x.png?token=1") ===
      "x.png",
  );

  // ----------------------------------------------------------
  // Profile field normalisation
  // ----------------------------------------------------------

  check("an absent phone is left untouched", profile.normaliseOptionalText(undefined) === undefined);
  check("a blank phone clears the column", profile.normaliseOptionalText("   ") === null);
  check("a phone is trimmed", profile.normaliseOptionalText("  +62 812 ") === "+62 812");

  const parsedBirthDate = profile.parseBirthDate("1990-05-04");
  check(
    "an ISO date of birth is parsed",
    parsedBirthDate instanceof Date && parsedBirthDate.toISOString().startsWith("1990-05-04"),
  );
  check("an absent date of birth clears the column", profile.parseBirthDate("") === null);
  check(
    "a malformed date of birth is refused",
    captureErrorCode(() => profile.parseBirthDate("not-a-date")) === "INVALID_BIRTH_DATE",
  );
}

run()
  .then(() => {
    if (failures > 0) {
      console.error(`\n${failures} check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nAll checks passed.");
  })
  .catch((error: unknown) => {
    const reason = error instanceof Error ? error.stack ?? error.message : String(error);

    console.error(`FAIL: the test harness threw — ${reason}`);
    process.exitCode = 1;
  });
