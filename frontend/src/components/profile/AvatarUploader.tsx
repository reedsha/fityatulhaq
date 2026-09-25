"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { resolveUnknownError } from "@/lib/errorMessages";
import { uploadAvatar } from "@/lib/profileApi";
import { AVATAR_ACCEPT_ATTRIBUTE, validateAvatarFile } from "@/lib/validation";

export interface AvatarUploaderProps {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  /** Refreshes the session context once the new photo is stored. */
  onUploaded: () => Promise<void>;
}

const AVATAR_INPUT_ID = "avatar-file-input";

/** Falls back to the member's initials when there is no photo to show. */
function initialsOf(fullName: string): string {
  const parts = fullName
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);

  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";

  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "?";
}

/**
 * Avatar picker: current photo, file selection, local preview and upload.
 *
 * The file is checked locally before it is sent, but only as a courtesy — the
 * backend re-derives the format from the magic number, so the browser's
 * `File.type` is never trusted to mean anything.
 */
export function AvatarUploader(props: AvatarUploaderProps): ReactElement {
  const { userId, fullName, avatarUrl, onUploaded } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Object URLs are a manual resource: tie the lifetime of each one to the
  // selection that produced it so switching files cannot leak the previous blob.
  useEffect((): (() => void) | undefined => {
    if (selected === null) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);

    return (): void => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selected]);

  const clearSelection = (): void => {
    setSelected(null);

    // Reset the input so choosing the same file again still fires `change`.
    if (inputRef.current !== null) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    const result = validateAvatarFile(file);

    if (!result.valid) {
      toast.error(result.error);
      clearSelection();
      return;
    }

    setSelected(file);
  };

  const handleUpload = async (): Promise<void> => {
    if (selected === null) {
      return;
    }

    setIsUploading(true);

    try {
      await uploadAvatar(userId, selected);

      clearSelection();
      toast.success("อัปเดตภาพของคุณแล้ว");

      // Re-reads the profile so the circle renders the URL the server actually
      // stored. Handled separately from the upload: the photo *is* saved, and
      // reporting the stale-refresh as a failed upload would be a lie.
      try {
        await onUploaded();
      } catch {
        toast.error("บันทึกแล้ว แต่เราไม่สามารถรีเฟรชข้อมูลของคุณได้ กรุณาโหลดหน้าใหม่");
      }
    } catch (error) {
      toast.error(resolveUnknownError(error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const imageSource = previewUrl ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {imageSource === null || imageSource.length === 0 ? (
          <div
            aria-hidden="true"
            className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-ink-200 bg-ink-100 text-heading-2 text-ink-500"
          >
            {initialsOf(fullName)}
          </div>
        ) : (
          // A plain <img> rather than next/image: avatars come from the Supabase
          // storage host, which would otherwise have to be added to
          // `images.remotePatterns`, and the optimiser buys nothing for an image
          // that is already stored at display size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSource}
            alt={`ภาพโปรไฟล์ของ ${fullName}`}
            width={128}
            height={128}
            className="h-32 w-32 rounded-full border-2 border-ink-200 object-cover"
          />
        )}

        {isUploading ? (
          <div
            aria-busy="true"
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-ink-900/60 text-white"
          >
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            <span className="mt-1 text-caption font-medium">กำลังอัปโหลด...</span>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={AVATAR_INPUT_ID}
        type="file"
        accept={AVATAR_ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {selected === null ? (
        <button
          type="button"
          onClick={() => {
            inputRef.current?.click();
          }}
          disabled={isUploading}
          className="rounded-full bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white transition duration-fast ease-standard hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          เปลี่ยนรูปภาพ
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="max-w-[12rem] truncate text-caption text-ink-500" title={selected.name}>
            {selected.name}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleUpload();
              }}
              disabled={isUploading}
              className="rounded-full bg-brand-600 px-4 py-2 text-body-sm font-semibold text-white transition duration-fast ease-standard hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              อัปโหลด
            </button>

            <button
              type="button"
              onClick={clearSelection}
              disabled={isUploading}
              className="rounded-full border border-ink-300 bg-white px-3 py-2 text-body-sm font-medium text-ink-700 transition duration-fast ease-standard hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      <p className="max-w-[14rem] text-center text-caption text-ink-600">
        JPEG, PNG, GIF หรือ WebP · ไม่เกิน 5 MB
      </p>
    </div>
  );
}
