/**
 * Member-action gate helpers — the frontend half of the PRD §6.4 model:
 * pages are public, member-only ACTIONS route through `/login?next=…` so the
 * sign-in form can return the visitor to where the action was blocked.
 *
 * `loginReturnHref` is the single source of the return-URL contract; the
 * M1.5 `LoginForm` redirect (resolvePostLoginTarget) is its other half.
 */

/**
 * The same three rules `LoginForm` applies before honouring a `next` value:
 * the path must start with a single slash, must not be protocol-relative, and
 * must carry no URL scheme — so a crafted link can never bounce a signed-in
 * member off-site.
 */
export function isSafeInternalPath(raw: string): boolean {
  const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

  return raw.startsWith("/") && !raw.startsWith("//") && !SCHEME_PATTERN.test(raw);
}

/**
 * Builds the sign-in URL that returns the visitor to `returnTo` after a
 * successful login. Unsafe or malformed paths fall back to plain `/login`,
 * whose post-login target is the site root.
 */
export function loginReturnHref(returnTo: string): string {
  if (!isSafeInternalPath(returnTo)) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(returnTo)}`;
}
