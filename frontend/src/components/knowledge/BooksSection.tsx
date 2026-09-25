"use client";

import { Book } from "lucide-react";
import type { ReactElement } from "react";

import { useAuth } from "@/context/AuthContext";
import { BOOKS } from "@/lib/knowledgeItemsData";

import { DownloadButton, LoginToDownloadLink } from "./gatedActions";

function BookCard({ book }: { book: (typeof BOOKS)[number] }): ReactElement {
  const { isAuthenticated } = useAuth();

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-card">
      {/* Cover placeholder — gradient block, no image files. */}
      <div
        aria-hidden="true"
        className="flex h-44 items-end rounded-xl bg-gradient-to-br from-brand-100 to-slate-200 p-4"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 text-brand-700">
          <Book aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
        </div>
      </div>

      <h3 className="mt-4 text-heading-4 text-ink-900">{book.title}</h3>
      <p className="mt-1 text-caption font-medium text-ink-500">{book.author}</p>
      <p className="mt-2 flex-1 text-body-sm leading-relaxed text-ink-600">{book.abstract}</p>

      <div className="mt-4 border-t border-ink-200 pt-4">
        {isAuthenticated ? (
          <DownloadButton assetId={book.assetId} fileType={book.fileType} returnTo="/knowledge/books" />
        ) : (
          <LoginToDownloadLink returnTo="/knowledge/books" />
        )}
      </div>
    </article>
  );
}

export default function BooksSection(): ReactElement {
  return (
    <section aria-label="ห้องสมุดหนังสือ">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {BOOKS.map((book) => (
          <li key={book.id}>
            <BookCard book={book} />
          </li>
        ))}
      </ul>
    </section>
  );
}
