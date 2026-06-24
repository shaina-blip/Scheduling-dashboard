export { default } from "next-auth/middleware";

// Protect everything except the login page, the NextAuth API routes, and static
// assets. Unauthenticated users are redirected to /login automatically.
export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
