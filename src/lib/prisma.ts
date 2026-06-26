import { PrismaClient } from "@prisma/client";

// Neon's pooled endpoint (host contains "-pooler") runs PgBouncer in
// transaction mode. Prisma must be told this (pgbouncer=true) or it uses
// prepared statements that break on the pooler — which on Vercel's serverless
// functions shows up as writes that don't persist. We append the flag at
// runtime so DATABASE_URL stays simple and this is impossible to forget.
function dbUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return url;
  if (url.includes("-pooler") && !/[?&]pgbouncer=/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = dbUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Only override when we actually have a URL (DATABASE_URL is absent during
    // the build step — let Prisma read it from env then).
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
