"use client";

import type { ReactElement } from "react";

import AcademicSection from "@/components/knowledge/AcademicSection";
import BiographySection from "@/components/knowledge/BiographySection";
import BooksSection from "@/components/knowledge/BooksSection";
import CampsSection from "@/components/knowledge/CampsSection";
import CoursesSection from "@/components/knowledge/CoursesSection";
import EncyclopediaSection from "@/components/knowledge/EncyclopediaSection";
import QaSection from "@/components/knowledge/QaSection";
import RecommendedSection from "@/components/knowledge/RecommendedSection";
import VideosSection from "@/components/knowledge/VideosSection";
import YouthAdviceSection from "@/components/knowledge/YouthAdviceSection";

/**
 * Routes a knowledge-collection slug to its section component. Unknown slugs
 * render nothing — the server shell has already shown its not-found block.
 */
export default function KnowledgeCategoryContent({ slug }: { slug: string }): ReactElement {
  switch (slug) {
    case "courses":
      return <CoursesSection />;
    case "camps":
      return <CampsSection />;
    case "academic":
      return <AcademicSection />;
    case "encyclopedia":
      return <EncyclopediaSection />;
    case "biography":
      return <BiographySection />;
    case "youth-advice":
      return <YouthAdviceSection />;
    case "qa":
      return <QaSection />;
    case "books":
      return <BooksSection />;
    case "videos":
      return <VideosSection />;
    case "recommended":
      return <RecommendedSection />;
    default:
      return <></>;
  }
}
