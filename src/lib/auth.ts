export const SESSION_COOKIE = "qtdt_session";

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return input === expected;
}

/** Dung Web Crypto (khong dung "node:crypto") de tuong thich ca Edge Runtime (middleware) lan Node runtime. */
export async function sessionTokenValue(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const data = new TextEncoder().encode(`${secret}:khao-sat-gv-session`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
