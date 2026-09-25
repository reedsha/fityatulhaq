"use client";

import { Check, EyeOff, MessageSquarePlus, ShieldCheck, X } from "lucide-react";
import { useCallback, useId, useState, type FormEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FormField } from "@/components/auth/FormField";
import { useAuth } from "@/context/AuthContext";
import { useWebboardResource } from "@/hooks/useWebboardResource";
import { timeAgo } from "@/lib/validation";
import {
  BOARD_META,
  MODERATION_ACTIONS,
  MODERATION_PATH,
  REPORT_REASON_LABELS,
  fetchModerationQueue,
  moderateComment,
  moderateThread,
  postOfficialAnswer,
  resolveReport,
  threadPath,
  type ModerationAction,
  type PendingComment,
  type PendingThread,
  type ReportEntry,
} from "@/lib/webboardApi";

import {
  AnswerStatusChip,
  AuthorLine,
  AvatarCircle,
  CARD_CLASSES,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PRIMARY_BUTTON_CLASSES,
  QUIET_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  WEBBOARD_LINK_CLASSES,
  resolveWriteError,
} from "./webboardUi";

/**
 * `/webboard/moderation` — the §7.1 approval queue and the §7.2 report queue.
 *
 * Where this lives, and why: §8.1 puts the Youth Care and general moderation
 * screens in Web 2, and M6 will wire that. Until then this is the Web 1 stand-in,
 * so the pre-moderation gate §7.1 demands is operable instead of just declared.
 * It is gated twice — the routes behind it require `CONTENT_MODERATOR`, and this
 * screen re-checks the role so a member never sees a queue whose every action
 * would come back 403.
 *
 * Moderators DO see the author of an anonymous post here. That is the point of
 * §7.1 recording the real submitter: the public page never shows it, the person
 * deciding whether to publish it must.
 */

/** PRD §6.2's third role. */
const CONTENT_MODERATOR_ROLE = "CONTENT_MODERATOR";

const MAX_REASON_LENGTH = 500;
const MAX_ANSWER_LENGTH = 5000;

function ReasonForm({
  heading,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  heading: string;
  submitLabel: string;
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
}): ReactElement {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (reason.trim().length === 0) {
      setFieldError("กรุณาระบุเหตุผล");
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event): void => void handleSubmit(event)} className="mt-3 space-y-3" noValidate>
      <FormField
        id={fieldId}
        name="reason"
        label={heading}
        value={reason}
        onChange={(_, value): void => {
          setReason(value);
          setFieldError(null);
        }}
        error={fieldError ?? undefined}
        multiline
        rows={3}
        maxLength={MAX_REASON_LENGTH}
        disabled={isSubmitting}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASSES}>
          {isSubmitting ? "กำลังบันทึก..." : submitLabel}
        </button>

        <button type="button" onClick={onCancel} disabled={isSubmitting} className={QUIET_BUTTON_CLASSES}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

function PendingThreadCard({
  thread,
  onChanged,
  onError,
}: {
  thread: PendingThread;
  onChanged: () => void;
  onError: (error: unknown) => void;
}): ReactElement {
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isAnsweringBusy, setIsAnsweringBusy] = useState(false);

  const meta = BOARD_META[thread.board];

  const run = async (action: ModerationAction, reason: string | null, message: string): Promise<void> => {
    try {
      await moderateThread(thread.id, action, reason);
      toast.success(message);
      setIsRejecting(false);
      onChanged();
    } catch (error) {
      onError(error);
    }
  };

  const handleAnswer = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (answer.trim().length === 0) {
      return;
    }

    setIsAnsweringBusy(true);

    try {
      await postOfficialAnswer(thread.id, answer.trim());
      toast.success("ตอบกลับอย่างเป็นทางการแล้ว กระทู้เผยแพร่เรียบร้อย");
      setAnswer("");
      setIsAnswering(false);
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setIsAnsweringBusy(false);
    }
  };

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-800">
          {meta.title}
        </span>
        <AnswerStatusChip isAnswered={false} />
      </div>

      <h3 className="mt-3 text-heading-4 text-ink-900">{thread.title}</h3>

      {thread.tags.length > 0 ? (
        <p className="mt-2 text-caption text-ink-500">{thread.tags.join(" • ")}</p>
      ) : null}

      <p className="mt-3 whitespace-pre-line text-body-sm text-ink-800">{thread.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-200 pt-3">
        <span className="inline-flex items-center gap-2 text-caption text-ink-600">
          <AvatarCircle member={thread.author} />
          <span className="font-semibold text-ink-800">{thread.author.fullName}</span>
          <span className="text-ink-500">{`@${thread.author.username}`}</span>
        </span>

        <time dateTime={thread.createdAt} className="text-caption text-ink-500">
          {timeAgo(thread.createdAt)}
        </time>

        {thread.anonymous ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-caption text-ink-600">
            <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
            ขอปกปิดตัวตนอย่างเข้มงวด
          </span>
        ) : null}
      </div>

      {isRejecting ? (
        <ReasonForm
          heading="เหตุผลการปฏิเสธ (ผู้เขียนจะเห็นข้อความนี้)"
          submitLabel="ยืนยันการปฏิเสธ"
          onSubmit={async (reason): Promise<void> => {
            await run(MODERATION_ACTIONS.REJECT, reason, "ปฏิเสธกระทู้แล้ว");
          }}
          onCancel={(): void => {
            setIsRejecting(false);
          }}
        />
      ) : null}

      {isAnswering ? (
        <form onSubmit={(event): void => void handleAnswer(event)} className="mt-3 space-y-3" noValidate>
          <FormField
            id={`moderation-answer-${thread.id}`}
            name="answer"
            label="คำตอบอย่างเป็นทางการ"
            value={answer}
            onChange={(_, value): void => {
              setAnswer(value);
            }}
            multiline
            rows={5}
            maxLength={MAX_ANSWER_LENGTH}
            disabled={isAnsweringBusy}
            hint="การตอบกลับอย่างเป็นทางการจะเผยแพร่กระทู้นี้ทันที"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={isAnsweringBusy} className={PRIMARY_BUTTON_CLASSES}>
              {isAnsweringBusy ? "กำลังส่ง..." : "ส่งคำตอบ"}
            </button>

            <button
              type="button"
              onClick={(): void => {
                setIsAnswering(false);
              }}
              disabled={isAnsweringBusy}
              className={QUIET_BUTTON_CLASSES}
            >
              ยกเลิก
            </button>
          </div>
        </form>
      ) : null}

      {!isRejecting && !isAnswering ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-3">
          <button
            type="button"
            onClick={(): void => {
              void run(MODERATION_ACTIONS.APPROVE, null, "อนุมัติและเผยแพร่กระทู้แล้ว");
            }}
            className={PRIMARY_BUTTON_CLASSES}
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            อนุมัติ
          </button>

          <button
            type="button"
            onClick={(): void => {
              setIsAnswering(true);
            }}
            className={SECONDARY_BUTTON_CLASSES}
          >
            <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            ตอบอย่างเป็นทางการ
          </button>

          <button
            type="button"
            onClick={(): void => {
              setIsRejecting(true);
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            ปฏิเสธ
          </button>
        </div>
      ) : null}
    </article>
  );
}

function PendingCommentCard({
  comment,
  onChanged,
  onError,
}: {
  comment: PendingComment;
  onChanged: () => void;
  onError: (error: unknown) => void;
}): ReactElement {
  const [isRejecting, setIsRejecting] = useState(false);

  const meta = BOARD_META[comment.board];

  const run = async (action: ModerationAction, reason: string | null, message: string): Promise<void> => {
    try {
      await moderateComment(comment.id, action, reason);
      toast.success(message);
      setIsRejecting(false);
      onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-800">
          ความคิดเห็น
        </span>

        <span className="text-caption text-ink-600">{`ใน ${meta.title}`}</span>

        <time dateTime={comment.createdAt} className="text-caption text-ink-500">
          {timeAgo(comment.createdAt)}
        </time>
      </div>

      <p className="mt-3 text-caption text-ink-500">{`กระทู้: ${comment.threadTitle}`}</p>

      <p className="mt-2 whitespace-pre-line text-body-sm text-ink-800">{comment.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-200 pt-3">
        <span className="inline-flex items-center gap-2 text-caption text-ink-600">
          <AvatarCircle member={comment.author} />
          <span className="font-semibold text-ink-800">{comment.author.fullName}</span>
          <span className="text-ink-500">{`@${comment.author.username}`}</span>
        </span>

        {comment.anonymous ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-caption text-ink-600">
            <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
            ขอปกปิดตัวตนอย่างเข้มงวด
          </span>
        ) : null}
      </div>

      {isRejecting ? (
        <ReasonForm
          heading="เหตุผลการปฏิเสธ (ไม่เผยแพร่ความคิดเห็นนี้)"
          submitLabel="ยืนยันการปฏิเสธ"
          onSubmit={async (reason): Promise<void> => {
            await run(MODERATION_ACTIONS.REJECT, reason, "ปฏิเสธความคิดเห็นแล้ว");
          }}
          onCancel={(): void => {
            setIsRejecting(false);
          }}
        />
      ) : null}

      {!isRejecting ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-3">
          <button
            type="button"
            onClick={(): void => {
              void run(MODERATION_ACTIONS.APPROVE, null, "อนุมัติและเผยแพร่ความคิดเห็นแล้ว");
            }}
            className={PRIMARY_BUTTON_CLASSES}
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            อนุมัติ
          </button>

          <button
            type="button"
            onClick={(): void => {
              setIsRejecting(true);
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            ปฏิเสธ
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ReportCard({
  report,
  onChanged,
  onError,
}: {
  report: ReportEntry;
  onChanged: () => void;
  onError: (error: unknown) => void;
}): ReactElement {
  const [isHiding, setIsHiding] = useState(false);

  const resolve = async (status: "DISMISSED" | "ACTIONED", message: string): Promise<void> => {
    try {
      await resolveReport(report.id, status);
      toast.success(message);
      onChanged();
    } catch (error) {
      onError(error);
    }
  };

  const threadId = report.target.type === "thread" ? report.target.id : report.target.threadId;

  /**
   * A moderator judging a report needs the surrounding conversation, so every
   * card links straight to the thread. The target carries its own board for
   * exactly this reason — a comment report has no other way to know it.
   */
  const threadHref = threadPath(report.target.board, threadId);

  /** §7.2's "hide": whichever kind of content was reported, moderated as itself. */
  const hideTarget = async (reason: string): Promise<void> => {
    if (report.target.type === "thread") {
      await moderateThread(report.target.id, MODERATION_ACTIONS.HIDE, reason);
      return;
    }

    await moderateComment(report.target.id, MODERATION_ACTIONS.HIDE, reason);
  };

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-state-warning-100 px-2.5 py-1 text-caption font-semibold text-state-warning-700">
          {REPORT_REASON_LABELS[report.reason]}
        </span>

        <time dateTime={report.createdAt} className="text-caption text-ink-500">
          {timeAgo(report.createdAt)}
        </time>
      </div>

      <p className="mt-3 text-body-sm text-ink-500">
        {report.target.type === "thread" ? "กระทู้ที่ถูกรายงาน" : "ความคิดเห็นที่ถูกรายงาน"}
      </p>

      <blockquote className="mt-1 border-l-2 border-ink-200 pl-3 text-body-sm text-ink-800">
        {report.target.type === "thread" ? report.target.title : report.target.body}
      </blockquote>

      <p className="mt-2">
        <a
          href={threadHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-caption ${WEBBOARD_LINK_CLASSES}`}
        >
          เปิดกระทู้ในแท็บใหม่เพื่อดูบริบท
        </a>
      </p>

      {report.detail !== null && report.detail.length > 0 ? (
        <p className="mt-3 text-body-sm text-ink-600">{`รายละเอียดจากผู้รายงาน: ${report.detail}`}</p>
      ) : null}

      <div className="mt-3 space-y-2 border-t border-ink-200 pt-3">
        <p className="text-caption text-ink-500">ผู้รายงาน</p>
        <AuthorLine author={{ kind: "member", member: report.reporter }} />

        <p className="text-caption text-ink-500">เจ้าของเนื้อหา</p>
        <span className="inline-flex items-center gap-2 text-caption text-ink-600">
          <AvatarCircle member={report.reportedAuthor} />
          <span className="font-semibold text-ink-800">{report.reportedAuthor.fullName}</span>
          <span className="text-ink-500">{`@${report.reportedAuthor.username}`}</span>
        </span>
      </div>

      {isHiding ? (
        <ReasonForm
          heading="เหตุผลการซ่อนเนื้อหา"
          submitLabel="ยืนยันการซ่อน"
          onSubmit={async (reason): Promise<void> => {
            try {
              await hideTarget(reason);
              await resolveReport(report.id, "ACTIONED");
              toast.success("ซ่อนเนื้อหาและปิดรายงานแล้ว");
              setIsHiding(false);
              onChanged();
            } catch (error) {
              onError(error);
            }
          }}
          onCancel={(): void => {
            setIsHiding(false);
          }}
        />
      ) : null}

      {!isHiding ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-3">
          <button
            type="button"
            onClick={(): void => {
              void resolve("DISMISSED", "ปิดรายงานโดยไม่ดำเนินการ");
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            ไม่ดำเนินการ
          </button>

          <button
            type="button"
            onClick={(): void => {
              setIsHiding(true);
            }}
            className={SECONDARY_BUTTON_CLASSES}
          >
            <EyeOff aria-hidden="true" className="h-4 w-4" />
            {report.target.type === "thread" ? "ซ่อนกระทู้" : "ซ่อนความคิดเห็น"}
          </button>

          <button
            type="button"
            onClick={(): void => {
              void resolve("ACTIONED", "ดำเนินการกับรายงานแล้ว");
            }}
            className={PRIMARY_BUTTON_CLASSES}
          >
            <Check aria-hidden="true" className="h-4 w-4" />
            ดำเนินการ
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function ModerationQueue(): ReactElement {
  const { user, isLoading: isSessionLoading } = useAuth();
  const [page, setPage] = useState(1);

  const queueResource = useWebboardResource(
    (signal) => fetchModerationQueue(page, signal),
    `moderation|${page}`,
  );

  const handleError = useCallback((error: unknown): void => {
    toast.error(resolveWriteError(error, MODERATION_PATH));
  }, []);

  if (isSessionLoading) {
    return <LoadingBlock label="กำลังโหลดเซสชันของคุณ" />;
  }

  if (user?.role !== CONTENT_MODERATOR_ROLE) {
    return (
      <EmptyState
        title="หน้านี้สำหรับผู้ดูแลเนื้อหา"
        description="การอนุมัติและตรวจสอบเนื้อหาในเว็บไซต์สงวนไว้สำหรับผู้ดูแลเนื้อหาเท่านั้น"
      />
    );
  }

  const queue = queueResource.data?.data ?? null;
  const pagination = queueResource.data?.pagination ?? null;
  const totalPages =
    pagination === null || pagination.limit === 0
      ? 1
      : Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-6">
      <p className="inline-flex items-center gap-2 text-body-sm text-ink-600">
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        อนุมัติคำถามของบอร์ดดูแลเยาวชน และตรวจสอบรายงานเนื้อหาจากทุกบอร์ด
        เนื้อหาที่อนุมัติจะเผยแพร่ต่อสาธารณะทันที
      </p>

      {queueResource.error !== null ? (
        <ErrorState message={queueResource.error} onRetry={queueResource.reload} />
      ) : null}

      {queueResource.isLoading && queue === null ? (
        <>
          <LoadingBlock label="กำลังโหลดคิวตรวจสอบ" />
          <LoadingBlock label="กำลังโหลดคิวตรวจสอบ" />
        </>
      ) : null}

      {queue !== null ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-label="คำถามรอตรวจสอบ" className="space-y-4">
            <h2 className="text-heading-3 text-ink-900">
              {`คำถามรอตรวจสอบ (${queue.pendingThreadTotal})`}
            </h2>

            {queue.pendingThreads.length === 0 ? (
              <EmptyState title="ไม่มีคำถามรอตรวจสอบ" description="คิวว่างในขณะนี้" />
            ) : (
              <ul className="space-y-4">
                {queue.pendingThreads.map((thread) => (
                  <li key={thread.id}>
                    <PendingThreadCard
                      thread={thread}
                      onChanged={queueResource.reload}
                      onError={handleError}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="ความคิดเห็นรอตรวจสอบ" className="space-y-4">
            <h2 className="text-heading-3 text-ink-900">
              {`ความคิดเห็นรอตรวจสอบ (${queue.pendingCommentTotal})`}
            </h2>

            <p className="text-body-sm text-ink-600">
              เฉพาะบอร์ดดูแลเยาวชนที่กลั่นกรองก่อนเผยแพร่ทั้งกระดาน
            </p>

            {queue.pendingComments.length === 0 ? (
              <EmptyState title="ไม่มีความคิดเห็นรอตรวจสอบ" description="คิวว่างในขณะนี้" />
            ) : (
              <ul className="space-y-4">
                {queue.pendingComments.map((comment) => (
                  <li key={comment.id}>
                    <PendingCommentCard
                      comment={comment}
                      onChanged={queueResource.reload}
                      onError={handleError}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="รายงานเนื้อหา" className="space-y-4">
            <h2 className="text-heading-3 text-ink-900">
              {`รายงานเนื้อหา (${queue.openReportTotal})`}
            </h2>

            {queue.openReports.length === 0 ? (
              <EmptyState title="ไม่มีรายงานค้างอยู่" description="ไม่มีรายงานที่รอการตรวจสอบ" />
            ) : (
              <ul className="space-y-4">
                {queue.openReports.map((report) => (
                  <li key={report.id}>
                    <ReportCard
                      report={report}
                      onChanged={queueResource.reload}
                      onError={handleError}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav aria-label="แบ่งหน้า" className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={(): void => {
              setPage((current) => Math.max(1, current - 1));
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            ก่อนหน้า
          </button>

          <p className="text-caption text-ink-600">{`หน้า ${page} จาก ${totalPages}`}</p>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={(): void => {
              setPage((current) => Math.min(totalPages, current + 1));
            }}
            className={QUIET_BUTTON_CLASSES}
          >
            ถัดไป
          </button>
        </nav>
      ) : null}
    </div>
  );
}
