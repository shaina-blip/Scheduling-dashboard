"use client";

import { signIn } from "next-auth/react";
import { GraduationCap } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <GraduationCap className="h-7 w-7 text-brand-700" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">
          Wildewood COO Dashboard
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Your morning command center — emails, schedules, students, ideas,
          reminders, and KPIs in one place.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === "AccessDenied"
              ? "That Google account isn't on the allow-list for this dashboard."
              : "Sign-in failed. Please try again."}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <p className="mt-4 text-xs text-stone-400">
          You'll be asked to grant read-only access to Gmail and Google Drive so
          the dashboard can surface emails to reply to and your student-notes
          docs.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
