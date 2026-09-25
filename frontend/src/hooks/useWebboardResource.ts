"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { resolveUnknownError } from "@/lib/errorMessages";

/**
 * Small data-loading hook for the webboard screens.
 *
 * Every board view needs the same four states — loading, loaded, failed, retry
 * — and the same cancellation rule: a response that arrives after the reader has
 * navigated on, or after the filters changed, must not overwrite newer state.
 *
 * Two arguments rather than a dependency array:
 *
 *  - `key` identifies the request. When it changes the loader runs again; that
 *    is the whole re-fetch trigger, so a caller cannot forget to list a
 *    dependency.
 *  - `load` is read through a ref, so a caller may write it inline without
 *    re-triggering anything.
 *
 * A failed load is reported as a Thai message (the backend's codes and messages
 * are machine-facing) plus a retry, never as a blank screen.
 */

export interface WebboardResource<T> {
  data: T | null;
  isLoading: boolean;
  /** Thai, ready to render. Null when the last load succeeded. */
  error: string | null;
  /**
   * The backend's code for a failed load, when it supplied one — the difference
   * between "this thread does not exist" and "the API is down", which the two
   * states should not present identically.
   */
  errorCode: string | null;
  reload: () => void;
}

export function useWebboardResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: string,
): WebboardResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loaderRef = useRef(load);

  // Declared before the fetch effect below so it always runs first within the
  // same commit, which keeps the ref current for the request that commit starts.
  useEffect((): void => {
    loaderRef.current = load;
  });

  useEffect((): (() => void) => {
    const controller = new AbortController();
    let isCurrent = true;

    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    loaderRef
      .current(controller.signal)
      .then((result: T): void => {
        if (isCurrent) {
          setData(result);
        }
      })
      .catch((caught: unknown): void => {
        // An aborted request is this effect's own cleanup, not a failure.
        if (isCurrent && (caught as { name?: string } | null)?.name !== "AbortError") {
          setError(resolveUnknownError(caught).message);
          setErrorCode(caught instanceof ApiError ? caught.code : null);
        }
      })
      .finally((): void => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return (): void => {
      isCurrent = false;
      controller.abort();
    };
  }, [key, reloadToken]);

  const reload = useCallback((): void => {
    setReloadToken((token) => token + 1);
  }, []);

  return { data, isLoading, error, errorCode, reload };
}
