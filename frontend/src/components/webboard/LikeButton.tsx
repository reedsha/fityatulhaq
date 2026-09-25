"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import toast from "react-hot-toast";

import { FOCUS_RING } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { loginReturnHref } from "@/lib/memberGate";
import { setReaction, type ReactionTargetRef } from "@/lib/webboardApi";

import { resolveWriteError } from "./webboardUi";

/**
 * §5.3.4 "กดถูกใจ (Like/Reaction)".
 *
 * Add and remove are separate idempotent calls (`PUT`/`DELETE`), so a retry after
 * a dropped response cannot flip the state twice. The server's response is what
 * the button then displays — the count it returns is the database's, not a local
 * guess.
 *
 * A guest sees the same control as a link into the login return flow, which is
 * how §6.4's "member action" reads without hiding that the action exists.
 */

const BASE_CLASSES = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition duration-fast ease-standard motion-reduce:transition-none ${FOCUS_RING}`;

export function LikeButton({
  target,
  likedByViewer,
  likeCount,
  returnTo,
}: {
  target: ReactionTargetRef;
  likedByViewer: boolean;
  likeCount: number;
  returnTo: string;
}): ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  // Seeded from the payload and then owned locally: the component is keyed by the
  // target id, so a different post or comment gets a fresh instance rather than
  // inheriting the previous one's state.
  const [state, setState] = useState({ liked: likedByViewer, likeCount });
  const [isBusy, setIsBusy] = useState(false);

  if (isLoading) {
    return (
      <span className={`${BASE_CLASSES} text-ink-400`}>
        <Heart aria-hidden="true" className="h-3.5 w-3.5" />
        {`ถูกใจ ${state.likeCount}`}
      </span>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href={loginReturnHref(returnTo)} className={`${BASE_CLASSES} text-ink-600 hover:bg-ink-100`}>
        <Heart aria-hidden="true" className="h-3.5 w-3.5" />
        {`ถูกใจ ${state.likeCount}`}
      </Link>
    );
  }

  const handleToggle = async (): Promise<void> => {
    setIsBusy(true);

    try {
      const result = await setReaction(target, !state.liked);

      setState({ liked: result.liked, likeCount: result.likeCount });
    } catch (error) {
      toast.error(resolveWriteError(error, returnTo));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(): void => {
        void handleToggle();
      }}
      aria-pressed={state.liked}
      disabled={isBusy}
      className={`${BASE_CLASSES} ${
        state.liked ? "bg-brand-100 text-brand-800" : "text-ink-600 hover:bg-ink-100"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <Heart
        aria-hidden="true"
        className="h-3.5 w-3.5"
        {...(state.liked ? { fill: "currentColor" } : {})}
      />
      {`ถูกใจ ${state.likeCount}`}
    </button>
  );
}
