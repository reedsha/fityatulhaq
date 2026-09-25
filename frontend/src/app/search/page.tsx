import type { Metadata } from "next";
import type { ReactElement } from "react";

import { AuthAwareShell } from "@/components/layout/AuthAwareShell";
import SearchPage from "@/components/search/SearchPage";

/**
 * Route shell for `/search` (§5.2.12).
 *
 * Thin by necessity: `export const metadata` is only honoured in a server
 * component, so the interactive search lives in `@/components/search/SearchPage`
 * and is composed here. `/search` is public — a guest can search the site — so
 * `requireAuth` is deliberately not passed.
 */
export const metadata: Metadata = {
  title: "ค้นหา",
  description: "ค้นหาเนื้อหาทุกหมวดหมู่ของ FityatulHaq จากจุดเดียว",
};

export default function SearchRoute(): ReactElement {
  return (
    <AuthAwareShell
      title="ค้นหา"
      description="ค้นหาข่าวสาร ประกาศ หลักสูตร หนังสือ วิดีโอ และอื่น ๆ จากจุดเดียว"
    >
      <SearchPage />
    </AuthAwareShell>
  );
}
