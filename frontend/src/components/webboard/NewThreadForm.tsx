"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FormField } from "@/components/auth/FormField";
import { FOCUS_RING } from "@/components/layout/Header";
import { useWebboardResource } from "@/hooks/useWebboardResource";
import { ApiError } from "@/lib/api";
import {
  BOARD_META,
  BOARD_ORDER,
  DEFAULT_NEW_THREAD_BOARD,
  MODERATION_STATUSES,
  NEW_THREAD_PATH,
  boardPath,
  createThread,
  fetchTags,
  threadPath,
  type BoardKey,
  type CreatedThread,
} from "@/lib/webboardApi";

import {
  CARD_CLASSES,
  EmptyState,
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
  resolveWriteError,
} from "./webboardUi";

/**
 * The "new thread" form behind `/webboard/new` — §5.3.2 "ตั้งคำถามใหม่" and
 * §5.3.3 "ตั้งกระทู้ใหม่".
 *
 * One form for both boards, because the differences are three fields deep: the
 * board picker decides whether tags and the strict-concealment option apply, and
 * what the thread is called. Two separate forms would duplicate the validation
 * and the submission handling for no gain.
 *
 * Validation mirrors the backend's bounds so the member is told before the round
 * trip; the server still enforces them, which is what actually matters.
 */

/** Mirrors `createThreadSchema` in the backend's webboard controller. */
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 150;
const MIN_BODY_LENGTH = 10;
const MAX_BODY_LENGTH = 10000;
const MAX_TAGS = 5;

const SELECT_CLASSES =
  "mt-1 block w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-body-sm text-ink-900 shadow-card transition duration-fast ease-standard motion-reduce:transition-none focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200";

const CHECKBOX_CLASSES =
  "h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

interface FieldErrors {
  title?: string;
  body?: string;
  form?: string;
}

function validate(board: BoardKey, title: string, body: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const isQuestion = BOARD_META[board].hasAnswerStatus;
  const titleLabel = isQuestion ? "หัวข้อคำถาม" : "หัวข้อกระทู้";

  if (trimmedTitle.length === 0) {
    errors.title = `กรุณากรอก${titleLabel}`;
  } else if (trimmedTitle.length < MIN_TITLE_LENGTH) {
    errors.title = `${titleLabel}ต้องมีอย่างน้อย ${MIN_TITLE_LENGTH} ตัวอักษร`;
  } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    errors.title = `${titleLabel}ต้องไม่เกิน ${MAX_TITLE_LENGTH} ตัวอักษร`;
  }

  if (trimmedBody.length === 0) {
    errors.body = "กรุณากรอกรายละเอียด";
  } else if (trimmedBody.length < MIN_BODY_LENGTH) {
    errors.body = `รายละเอียดต้องมีอย่างน้อย ${MIN_BODY_LENGTH} ตัวอักษร`;
  } else if (trimmedBody.length > MAX_BODY_LENGTH) {
    errors.body = `รายละเอียดต้องไม่เกิน ${MAX_BODY_LENGTH} ตัวอักษร`;
  }

  return errors;
}

/**
 * `initialBoard` comes from the page's `?board=` query, so the form is right on
 * the first paint rather than correcting itself after mount. Without it the form
 * starts on `DEFAULT_NEW_THREAD_BOARD`, which is the safe choice.
 */
export function NewThreadForm({ initialBoard }: { initialBoard: BoardKey | null }): ReactElement {
  const router = useRouter();

  const [board, setBoard] = useState<BoardKey>(initialBoard ?? DEFAULT_NEW_THREAD_BOARD);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedThread | null>(null);

  const tagsResource = useWebboardResource(fetchTags, "webboard-tags");
  const meta = BOARD_META[board];
  const isQuestion = meta.hasAnswerStatus;

  const clearFieldError = (field: keyof FieldErrors): void => {
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  };

  const handleBoardChange = (next: BoardKey): void => {
    setBoard(next);
    setErrors({});

    // Carrying a tag selection into a board that has no tags (or a concealment
    // flag into a board that names its authors) would submit a field the PRD
    // never offers there.
    if (!BOARD_META[next].allowsTags) {
      setSelectedTags([]);
    }

    if (!BOARD_META[next].isAnonymous) {
      setAnonymous(false);
    }
  };

  const toggleTag = (slug: string, isChecked: boolean): void => {
    setSelectedTags((current) => {
      if (!isChecked) {
        return current.filter((entry) => entry !== slug);
      }

      if (current.includes(slug) || current.length >= MAX_TAGS) {
        return current;
      }

      return [...current, slug];
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const found = validate(board, title, body);

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await createThread({
        board,
        title: title.trim(),
        body: body.trim(),
        tags: [...selectedTags],
        anonymous,
      });

      if (result.moderation === MODERATION_STATUSES.PUBLISHED) {
        toast.success("ตั้งกระทู้แล้ว");
        router.push(threadPath(result.board, result.id));
        return;
      }

      // Pre-moderated: the thread has no public page yet (§7.1), so the form
      // stays and reports the outcome instead of navigating to a 404.
      setCreated(result);
    } catch (error) {
      // Prohibited language belongs on the field that caused it, not in a
      // corner toast the member has to connect to their text.
      if (error instanceof ApiError && error.code === "CONTENT_FLAGGED") {
        setErrors({ body: "ข้อความมีถ้อยคำที่ไม่เหมาะสม กรุณาแก้ไขแล้วลองอีกครั้ง" });
        return;
      }

      toast.error(resolveWriteError(error, NEW_THREAD_PATH));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (created !== null) {
    return (
      <EmptyState
        title={isQuestion ? "ส่งคำถามของคุณแล้ว" : "ส่งกระทู้ของคุณแล้ว"}
        description="ทีมงานจะตรวจสอบเนื้อหาก่อนเผยแพร่ คุณจะเห็นสถานะของกระทู้ได้ในโปรไฟล์เมื่อระบบกิจกรรมพร้อมใช้งาน"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={boardPath(created.board)} className={SECONDARY_BUTTON_CLASSES}>
            กลับไปที่{BOARD_META[created.board].title}
          </Link>
          <Link href="/profile" className={SECONDARY_BUTTON_CLASSES}>
            ไปที่โปรไฟล์
          </Link>
        </div>
      </EmptyState>
    );
  }

  return (
    <form onSubmit={(event): void => void handleSubmit(event)} className={`${CARD_CLASSES} space-y-5`} noValidate>
      <div>
        <label htmlFor="thread-board" className="block text-body-sm font-medium text-ink-700">
          เลือกบอร์ด
        </label>

        <select
          id="thread-board"
          name="board"
          value={board}
          disabled={isSubmitting}
          onChange={(event): void => {
            handleBoardChange(event.target.value as BoardKey);
          }}
          className={SELECT_CLASSES}
        >
          {BOARD_ORDER.map((key) => (
            <option key={key} value={key}>
              {BOARD_META[key].title}
            </option>
          ))}
        </select>

        <p className="mt-1 text-caption text-ink-500">{meta.cardBlurb}</p>
      </div>

      <FormField
        id="thread-title"
        name="title"
        label={isQuestion ? "หัวข้อคำถาม" : "หัวข้อกระทู้"}
        value={title}
        onChange={(_, value): void => {
          setTitle(value);
          clearFieldError("title");
        }}
        error={errors.title}
        required
        maxLength={MAX_TITLE_LENGTH}
        disabled={isSubmitting}
      />

      <FormField
        id="thread-body"
        name="body"
        label={isQuestion ? "รายละเอียดคำถาม" : "รายละเอียด"}
        value={body}
        onChange={(_, value): void => {
          setBody(value);
          clearFieldError("body");
        }}
        error={errors.body}
        required
        multiline
        rows={8}
        maxLength={MAX_BODY_LENGTH}
        disabled={isSubmitting}
        hint={
          isQuestion
            ? "เล่ารายละเอียดเท่าที่คุณสะดวก หลีกเลี่ยงการระบุชื่อหรือข้อมูลที่ระบุตัวตนของผู้อื่น"
            : undefined
        }
      />

      {meta.allowsTags && (tagsResource.data ?? []).length > 0 ? (
        <fieldset disabled={isSubmitting}>
          <legend className="text-body-sm font-medium text-ink-700">แท็ก (ไม่บังคับ)</legend>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
            {(tagsResource.data ?? []).map((tag) => (
              <label key={tag.slug} className="inline-flex items-center gap-2 text-body-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.slug)}
                  onChange={(event): void => {
                    toggleTag(tag.slug, event.target.checked);
                  }}
                  className={CHECKBOX_CLASSES}
                />
                {tag.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {meta.isAnonymous ? (
        <div className="rounded-lg bg-surface-sunken p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={anonymous}
              disabled={isSubmitting}
              onChange={(event): void => {
                setAnonymous(event.target.checked);
              }}
              className={`mt-0.5 ${CHECKBOX_CLASSES}`}
            />
            <span>
              <span className="block text-body-sm font-medium text-ink-800">
                ต้องการปกปิดตัวตนอย่างเข้มงวด
              </span>
              <span className="mt-1 block text-caption text-ink-600">
                คำถามนี้จะไม่ถูกเชื่อมโยงกับคำถามอื่นของคุณเลย
                และระบบจะไม่แสดงชื่อผู้ใช้ของคุณต่อสาธารณะ
              </span>
            </span>
          </label>

          <p className="mt-3 border-t border-ink-200 pt-3 text-caption text-ink-600">
            ไม่ว่าคุณจะเลือกตัวเลือกนี้หรือไม่ ระบบจะไม่แสดงชื่อจริงและชื่อผู้ใช้ของคุณต่อสาธารณะ
            โดยแสดงเป็นผู้ใช้นิรนามพร้อมรหัสอ้างอิงเสมอ
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-5">
        <button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON_CLASSES}>
          {isSubmitting ? "กำลังส่ง..." : isQuestion ? "ส่งคำถาม" : "ตั้งกระทู้"}
        </button>

        <Link href={boardPath(board)} className={`rounded text-body-sm text-brand-700 underline-offset-4 hover:underline ${FOCUS_RING}`}>
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
