import { randomUUID } from "node:crypto";

import { toErrorMessage } from "../middleware/errorFormatter";
import { logger } from "../middleware/logger";

/** Largest avatar the API accepts (5 MB). */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Stored avatars must fall inside these bounds, in pixels. */
export const MIN_AVATAR_DIMENSION = 100;
export const MAX_AVATAR_DIMENSION = 2048;

/** Image formats the avatar endpoint accepts, in the order they are sniffed. */
export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export interface ImageValidationResult {
  isValid: boolean;
  /** Empty when the format could not be identified. */
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

/** Label used when a client sends no usable filename. */
const UNNAMED_FILE = "unnamed";

/** Path separators plus the characters Windows refuses in a filename. */
const UNSAFE_FILENAME_CHARACTERS = /[\\/:*?"<>|]/g;

/** C0 control range plus DEL — stripped so a filename cannot forge a log line. */
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

const MAX_LABEL_LENGTH = 50;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// ------------------------------------------------------------
// Magic numbers
//
// Every format is identified by its leading bytes, never by the extension or
// the `Content-Type` the client claimed: both are attacker-controlled, and a
// polyglot file (a valid script that also opens as an image) is exactly what an
// extension check lets through.
// ------------------------------------------------------------

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF_SIGNATURE = [0x47, 0x49, 0x46, 0x38];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50];

/** Start-of-frame markers, which are the only JPEG segments carrying the size. */
const JPEG_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/** Markers that stand alone and therefore carry no length field. */
const JPEG_STANDALONE_MARKERS = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);

const JPEG_START_OF_SCAN = 0xda;
const JPEG_END_OF_IMAGE = 0xd9;
const JPEG_START_OF_IMAGE = 0xd8;

/** WebP lossless and lossy payload signatures. */
const WEBP_LOSSLESS_SIGNATURE = 0x2f;
const WEBP_LOSSY_START_CODE = [0x9d, 0x01, 0x2a];

/** Returns the byte at `index`, or `-1` when the buffer is too short. */
function byteAt(buffer: Buffer, index: number): number {
  const value = buffer[index];

  return value === undefined ? -1 : value;
}

function hasBytes(buffer: Buffer, offset: number, count: number): boolean {
  return offset >= 0 && count >= 0 && offset + count <= buffer.length;
}

function matches(buffer: Buffer, offset: number, signature: readonly number[]): boolean {
  if (!hasBytes(buffer, offset, signature.length)) {
    return false;
  }

  return signature.every(
    (expected: number, position: number): boolean => byteAt(buffer, offset + position) === expected,
  );
}

function readUInt24LE(buffer: Buffer, offset: number): number {
  return (
    byteAt(buffer, offset) |
    (byteAt(buffer, offset + 1) << 8) |
    (byteAt(buffer, offset + 2) << 16)
  );
}

// ------------------------------------------------------------
// Format sniffing
// ------------------------------------------------------------

/**
 * Identifies the image format from its magic number. Returns `null` for
 * anything else, including files that merely claim to be an image.
 */
export function detectImageMimeType(buffer: Buffer): SupportedImageMimeType | null {
  if (matches(buffer, 0, PNG_SIGNATURE)) {
    return "image/png";
  }

  if (matches(buffer, 0, GIF_SIGNATURE)) {
    return "image/gif";
  }

  if (matches(buffer, 0, RIFF_SIGNATURE) && matches(buffer, 8, WEBP_TAG)) {
    return "image/webp";
  }

  // JPEG always opens with SOI (FF D8) followed by a marker; the exact APPn
  // marker varies (JFIF uses FF E0, EXIF uses FF E1), so only the first three
  // bytes are load-bearing.
  if (byteAt(buffer, 0) === 0xff && byteAt(buffer, 1) === 0xd8 && byteAt(buffer, 2) === 0xff) {
    return "image/jpeg";
  }

  return null;
}

// ------------------------------------------------------------
// Dimension parsing
//
// Dimensions are read straight out of the header instead of decoding the image.
// Phase 3 only needs width/height for a bounds check, and the alternatives all
// cost more than they are worth here: `sharp` is a heavy native binary to add
// for two integers, and a full decode is a denial-of-service vector on a 5 MB
// upload. Header parsing cannot be tricked into claiming a size the file does
// not declare, which is all the bounds check needs.
// ------------------------------------------------------------

function readPngDimensions(buffer: Buffer): ImageDimensions | null {
  // IHDR is mandatory and must be the first chunk: an 8-byte signature, then the
  // 4-byte chunk length and the "IHDR" tag, placing width at byte 16.
  if (!hasBytes(buffer, 16, 8) || buffer.toString("ascii", 12, 16) !== "IHDR") {
    return null;
  }

  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readGifDimensions(buffer: Buffer): ImageDimensions | null {
  // The logical screen descriptor sits immediately after "GIF87a" / "GIF89a".
  if (!hasBytes(buffer, 6, 4)) {
    return null;
  }

  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function readJpegDimensions(buffer: Buffer): ImageDimensions | null {
  // Walk the segment chain until the first start-of-frame segment, which is the
  // only place the pixel size is recorded.
  let offset = 2;

  while (offset + 1 < buffer.length) {
    if (byteAt(buffer, offset) !== 0xff) {
      // Padding or a malformed chain: resync on the next marker.
      offset += 1;
      continue;
    }

    const marker = byteAt(buffer, offset + 1);

    if (marker === -1) {
      return null;
    }

    if (marker === JPEG_START_OF_IMAGE || JPEG_STANDALONE_MARKERS.has(marker)) {
      offset += 2;
      continue;
    }

    // The entropy-coded scan begins here, so no size segment follows.
    if (marker === JPEG_START_OF_SCAN || marker === JPEG_END_OF_IMAGE) {
      return null;
    }

    // Skipping stuffed bytes (FF 00) and stray fill bytes (FF FF).
    if (marker === 0x00 || marker === 0xff) {
      offset += marker === 0x00 ? 2 : 1;
      continue;
    }

    if (!hasBytes(buffer, offset + 2, 2)) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (segmentLength < 2) {
      return null;
    }

    if (JPEG_FRAME_MARKERS.has(marker)) {
      // Segment payload: precision (1), height (2), width (2).
      if (!hasBytes(buffer, offset + 4, 5)) {
        return null;
      }

      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    // The length field counts itself, so the next marker is past it plus the payload.
    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer): ImageDimensions | null {
  // Layout: "RIFF" (4) size (4) "WEBP" (4), then the first chunk's tag and size,
  // which places the first chunk payload at byte 20.
  if (!hasBytes(buffer, 12, 4)) {
    return null;
  }

  const chunkTag = buffer.toString("ascii", 12, 16);

  if (chunkTag === "VP8X") {
    // Payload: flags (1), reserved (3), canvas width - 1 (3), canvas height - 1 (3).
    if (!hasBytes(buffer, 24, 6)) {
      return null;
    }

    return {
      width: readUInt24LE(buffer, 24) + 1,
      height: readUInt24LE(buffer, 27) + 1,
    };
  }

  if (chunkTag === "VP8L") {
    // Payload: 0x2F signature (1), then width - 1 and height - 1 packed into
    // 14 bits each, little-endian, across the next four bytes.
    if (!hasBytes(buffer, 21, 4) || byteAt(buffer, 20) !== WEBP_LOSSLESS_SIGNATURE) {
      return null;
    }

    const b0 = byteAt(buffer, 21);
    const b1 = byteAt(buffer, 22);
    const b2 = byteAt(buffer, 23);
    const b3 = byteAt(buffer, 24);

    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }

  if (chunkTag === "VP8 ") {
    // Payload: frame tag (3), start code (3), then 14-bit width and height.
    if (!hasBytes(buffer, 26, 4) || !matches(buffer, 23, WEBP_LOSSY_START_CODE)) {
      return null;
    }

    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  return null;
}

function readDimensions(
  buffer: Buffer,
  mimeType: SupportedImageMimeType,
): ImageDimensions | null {
  switch (mimeType) {
    case "image/png":
      return readPngDimensions(buffer);
    case "image/gif":
      return readGifDimensions(buffer);
    case "image/jpeg":
      return readJpegDimensions(buffer);
    case "image/webp":
      return readWebpDimensions(buffer);
    default:
      return null;
  }
}

function rejection(fileSize: number): ImageValidationResult {
  return { isValid: false, mimeType: "", width: 0, height: 0, fileSize };
}

/**
 * Validates an uploaded avatar.
 *
 * Checks run cheapest-first and the magic number is always checked before the
 * dimensions are parsed, so a mislabelled file is rejected without the parser
 * ever touching it. Never throws: any unexpected failure is logged and reported
 * as an invalid image, because an upload problem must not become a 500.
 */
export async function validateImageFile(buffer: Buffer): Promise<ImageValidationResult> {
  const fileSize = buffer.length;

  try {
    if (fileSize === 0) {
      logger.warn("[IMAGE_REJECTED] Empty upload");
      return rejection(fileSize);
    }

    if (fileSize > MAX_AVATAR_BYTES) {
      logger.warn(`[IMAGE_REJECTED] Upload of ${fileSize} bytes exceeds the ${MAX_AVATAR_BYTES} byte limit`);
      return rejection(fileSize);
    }

    const mimeType = detectImageMimeType(buffer);

    if (mimeType === null) {
      logger.warn("[IMAGE_REJECTED] Magic number does not match a supported image format");
      return rejection(fileSize);
    }

    const dimensions = readDimensions(buffer, mimeType);

    if (dimensions === null) {
      logger.warn(`[IMAGE_REJECTED] Could not read dimensions from ${mimeType} data`);
      return rejection(fileSize);
    }

    const { width, height } = dimensions;

    if (width <= 0 || height <= 0) {
      logger.warn(`[IMAGE_REJECTED] Non-positive dimensions in ${mimeType} data`);
      return rejection(fileSize);
    }

    if (width < MIN_AVATAR_DIMENSION || height < MIN_AVATAR_DIMENSION) {
      logger.warn(
        `[IMAGE_REJECTED] ${width}x${height} is below the ${MIN_AVATAR_DIMENSION}px minimum`,
      );
      return rejection(fileSize);
    }

    if (width > MAX_AVATAR_DIMENSION || height > MAX_AVATAR_DIMENSION) {
      logger.warn(
        `[IMAGE_REJECTED] ${width}x${height} is above the ${MAX_AVATAR_DIMENSION}px maximum`,
      );
      return rejection(fileSize);
    }

    return { isValid: true, mimeType, width, height, fileSize };
  } catch (error) {
    logger.warn(`[IMAGE_REJECTED] Validation threw: ${toErrorMessage(error)}`);
    return rejection(fileSize);
  }
}

/**
 * Builds the stored filename.
 *
 * A UUID replaces whatever the client sent, which removes path traversal and
 * overwrite attacks by construction: the name is generated here and is never
 * derived from user input.
 */
export function generateAvatarFilename(mimeType: string): string {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];

  if (extension === undefined) {
    throw new Error(`Unsupported image MIME type: ${mimeType}`);
  }

  return `${randomUUID()}.${extension}`;
}

/**
 * Produces a safe, short label for logging and metadata only — it is never used
 * as the stored filename (see `generateAvatarFilename`).
 */
export function sanitizeFileName(originalName?: string): string {
  if (originalName === undefined) {
    return UNNAMED_FILE;
  }

  const cleaned = originalName
    .replace(CONTROL_CHARACTERS, "")
    .replace(UNSAFE_FILENAME_CHARACTERS, "")
    .replace(/\.\./g, "")
    .trim()
    .slice(0, MAX_LABEL_LENGTH)
    .trim();

  return cleaned.length > 0 ? cleaned : UNNAMED_FILE;
}
