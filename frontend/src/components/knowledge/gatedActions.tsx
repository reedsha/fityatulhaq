"use client";

import { useCallback, useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FOCUS_RING } from "@/components/layout/Header";
import { ApiError, request } from "@/lib/api";
import { loginReturnHref } from "@/lib/memberGate";

/**
 * Shared scaffolding for the two gated collections (academic, books):
 * everyone reads the abstract, only a member triggers the signed-URL download
 * (PRD §5.2.4, §5.2.9 + §6.4). Guests get a login link that returns them to
 * this page via the M1.5 `?next=` flow.
 *
 * The signing endpoint is real but its upstream (Web 2) is unwired until M6,
 * so a 502/503 is the EXPECTED outcome today and is reported honestly as
 * "library being connected" rather than as an error the member caused.
 */

interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: number;
}

/** Backend/library codes that mean "the archive is not connected yet". */
const LIBRARY_PENDING_CODES = new Set([
  "SERVICE_UNAVAILABLE",
  "SERVICE_CREDENTIALS_REJECTED",
  "ASSET_NOT_FOUND",
  "UPSTREAM_UNAVAILABLE",
  "UPSTREAM_NOT_FOUND",
  "UPSTREAM_CREDENTIALS_REJECTED",
]);

const ACTION_BUTTON_CLASSES =
  "inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-caption font-bold text-white transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60";

/** The member-facing download action, with honest in-flight/error states. */
export function DownloadButton({
  assetId,
  fileType,
  returnTo,
}: {
  assetId: string;
  fileType: "PDF" | "Word";
  returnTo: string;
}): ReactElement {
  const [isSigning, setIsSigning] = useState(false);

  const handleDownload = useCallback(async (): Promise<void> => {
    setIsSigning(true);

    try {
      const signed = await request<SignedUrlResponse>("/assets/sign", {
        method: "POST",
        body: JSON.stringify({ assetId }),
      });

      window.open(signed.signedUrl, "_blank", "noopener");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast.error("เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง");
          window.location.href = loginReturnHref(returnTo);
          return;
        }

        if (LIBRARY_PENDING_CODES.has(error.code)) {
          toast("กำลังเชื่อมต่อคลังดิจิทัล — การดาวน์โหลดจะพร้อมใช้เมื่อการซิงก์คลังเก็บเสร็จสมบูรณ์", {
            icon: "ℹ️",
            duration: 6000,
          });
          return;
        }
      }

      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองอีกครั้งในสักครู่");
    } finally {
      setIsSigning(false);
    }
  }, [assetId, returnTo]);

  return (
    <button
      type="button"
      onClick={(): void => {
        void handleDownload();
      }}
      disabled={isSigning}
      className={ACTION_BUTTON_CLASSES}
    >
      {isSigning ? "กำลังเตรียม..." : `ดาวน์โหลด (${fileType})`}
    </button>
  );
}

/** The guest-facing action: a login link that returns to `returnTo`. */
export function LoginToDownloadLink({ returnTo }: { returnTo: string }): ReactElement {
  return (
    <a
      href={loginReturnHref(returnTo)}
      className={`inline-flex items-center justify-center rounded-full border border-brand-600 px-4 py-2 text-caption font-bold text-brand-700 transition duration-fast ease-standard motion-reduce:transition-none hover:bg-brand-600 hover:text-white ${FOCUS_RING}`}
    >
      เข้าสู่ระบบเพื่อดาวน์โหลด
    </a>
  );
}
