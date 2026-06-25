import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/** Returns the signed-in user's email, or null. */
export async function getUserEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

/** Returns the user email or throws — for server actions that require auth. */
export async function requireUserEmail(): Promise<string> {
  const email = await getUserEmail();
  if (!email) throw new Error("Not authenticated");
  return email;
}

/** Returns the Google access token from the current session, or null. */
export async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session as any)?.accessToken ?? null;
}

/** Returns the signed-in user's display name, or null. */
export async function getUserName(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.name ?? null;
}
