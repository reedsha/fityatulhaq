"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { useId, useState, type FormEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FormField } from "@/components/auth/FormField";
import { ApiError } from "@/lib/api";
import { loginReturnHref } from "@/lib/memberGate";
import { useAuth } from "@/context/AuthContext";
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  createReport,
  type ReportReason,
} from "@/lib/webboardApi";

import { CARD_CLASSES, PRIMARY_BUTTON_CLASSES, QUIET_BUTTON_CLASSES, resolveWriteError } from "./webboardUi";

/**
 * §7.2 — "รายงานเนื้อหาไม่เหมาะสมในทุกโพสต์/คอมเมนต์".
 *
 * An inline disclosure rather than a modal: the form opens directly beneath the
 * item it refers to, so the context is never lost, there is no focus trap to get
 * wrong, and keyboard users simply Tab from the trigger into the panel. Nothing
 * autofocuses — stealing focus is what makes a disclosure like this feel like a
 * dialog and leaves focus stranded when it closes.
 *
 * The panel is member-only: a guest sees the trigger as a link through
 * `/login?next=…`, since reporting is a member action in the §6.4 model.
 */

/** Bounds mirroring `createReportSchema` in the backend. */
const MAX_DETAIL_LENGTH = 500;

const RADIO_CLASSES =
  "h-4 w-4 shrink-0 border-ink-300 text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

export function ReportTrigger({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={QUIET_BUTTON_CLASSES}
    >
      <Flag aria-hidden="true" className="h-3.5 w-3.5" />
      รายงานเนื้อหาไม่เหมาะสม
    </button>
  );
}

export function ReportPanel({
  postId,
  commentId,
  returnTo,
  onClose,
}: {
  postId: string | null;
  commentId: string | null;
  returnTo: string;
  onClose: () => void;
}): ReactElement {
  const { isAuthenticated } = useAuth();
  const headingId = useId();
  const radioGroupName = useId();

  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS.OTHER);
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isAuthenticated) {
    return (
      <section aria-labelledby={headingId} className={`mt-3 ${CARD_CLASSES}`}>
        <h4 id={headingId} className="text-heading-4 text-ink-900">
          รายงานเนื้อหา
        </h4>

        <p className="mt-2 text-body-sm text-ink-600">
          การรายงานเนื้อหาเป็นสิทธิ์ของสมาชิก กรุณาเข้าสู่ระบบก่อนรายงาน
        </p>

        <Link href={loginReturnHref(returnTo)} className={`mt-4 ${PRIMARY_BUTTON_CLASSES}`}>
          เข้าสู่ระบบ
        </Link>
      </section>
    );
  }

  if (isDone) {
    return (
      <section aria-labelledby={headingId} className={`mt-3 ${CARD_CLASSES}`}>
        <h4 id={headingId} className="text-heading-4 text-ink-900">
          ส่งรายงานแล้ว
        </h4>

        <p className="mt-2 text-body-sm text-ink-600">
          ขอบคุณสำหรับรายงาน ทีมงานจะตรวจสอบเนื้อหานี้โดยเร็ว
        </p>

        <button type="button" onClick={onClose} className={`mt-4 ${QUIET_BUTTON_CLASSES}`}>
          ปิด
        </button>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await createReport({
        postId,
        commentId,
        reason,
        detail: detail.trim() === "" ? null : detail.trim(),
      });

      setIsDone(true);
    } catch (error) {
      // Reporting the same item twice is the member's intent already recorded,
      // not a failure to act on, so it lands on the same confirmation.
      if (error instanceof ApiError && error.code === "ALREADY_REPORTED") {
        setIsDone(true);
        return;
      }

      toast.error(resolveWriteError(error, returnTo));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby={headingId} className={`mt-3 ${CARD_CLASSES}`}>
      <h4 id={headingId} className="text-heading-4 text-ink-900">
        รายงานเนื้อหา
      </h4>

      <p className="mt-2 text-body-sm text-ink-600">
        เลือกเหตุผลที่ตรงกับปัญหาที่คุณพบ ทีมงานจะตรวจสอบและดำเนินการตามกติกาการใช้งาน
      </p>

      <form onSubmit={(event): void => void handleSubmit(event)} className="mt-4 space-y-4">
        <fieldset disabled={isSubmitting}>
          <legend className="text-body-sm font-medium text-ink-700">เหตุผล</legend>

          <div className="mt-2 space-y-2">
            {Object.values(REPORT_REASONS).map((value) => (
              <label key={value} className="flex items-center gap-2 text-body-sm text-ink-700">
                <input
                  type="radio"
                  name={radioGroupName}
                  value={value}
                  checked={value === reason}
                  onChange={(): void => {
                    setReason(value);
                  }}
                  className={RADIO_CLASSES}
                />
                {REPORT_REASON_LABELS[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField
          id={`${radioGroupName}-detail`}
          name="detail"
          label="รายละเอียดเพิ่มเติม"
          value={detail}
          onChange={(_, value): void => {
            setDetail(value);
          }}
          optional
          multiline
          rows={3}
          maxLength={MAX_DETAIL_LENGTH}
          disabled={isSubmitting}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASSES}>
            {isSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
          </button>

          <button type="button" onClick={onClose} disabled={isSubmitting} className={QUIET_BUTTON_CLASSES}>
            ยกเลิก
          </button>
        </div>
      </form>
    </section>
  );
}
