"use client";

import { GraduationCap } from "lucide-react";
import type { ReactElement } from "react";

import { FOCUS_RING } from "@/components/layout/Header";
import { COURSES, type CourseItem } from "@/lib/knowledgeItemsData";
import { formatDate } from "@/lib/validation";

/** Difficulty chip colours — token palette only, AA against white cards. */
const DIFFICULTY_CHIP: Record<CourseItem["difficulty"], string> = {
  Beginner: "bg-state-success-50 text-state-success-700",
  Intermediate: "bg-blue-50 text-blue-700",
  Advanced: "bg-tertiary-200 text-tertiary-800",
};

function CourseCard({ course }: { course: CourseItem }): ReactElement {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <GraduationCap aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${DIFFICULTY_CHIP[course.difficulty]}`}
        >
          {course.difficulty}
        </span>
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900">{course.title}</h3>
      <p className="mt-2 flex-1 text-body-sm leading-relaxed text-ink-600">{course.description}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-3 text-caption text-ink-500">
        <span>
          Starts <time dateTime={course.startDate}>{formatDate(course.startDate)}</time>
        </span>
        <span>{`${String(course.lessons)} lessons`}</span>
      </div>
    </article>
  );
}

export default function CoursesSection(): ReactElement {
  return (
    <section aria-label="Courses">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => (
          <li key={course.id} className={FOCUS_RING}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}
