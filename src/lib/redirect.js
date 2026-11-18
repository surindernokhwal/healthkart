// Turns a "return to" value (from ?callbackUrl= or a hidden form field) into a
// safe path on this website. Anything that could send the user to another
// site (an absolute URL to another host, "//evil.com", "/\evil.com") is
// rejected, so the login page cannot be used as an open redirect.
export function safeNextPath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) return null;

  let path = value;
  // Auth.js puts a full URL in callbackUrl; keep only its path and query.
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      path = url.pathname + url.search;
    } catch {
      return null;
    }
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/api/")) return null;
  return path;
}
