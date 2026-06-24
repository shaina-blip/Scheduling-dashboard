"use client";

import { signOut } from "next-auth/react";
import { GraduationCap, LogOut, Upload } from "lucide-react";
import Link from "next/link";

export default function Header({
  name,
  greeting,
}: {
  name: string;
  greeting: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
            <GraduationCap className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              Wildewood COO Dashboard
            </p>
            <p className="text-xs text-stone-500">{greeting}, {name}.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/import"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            <Upload className="h-4 w-4" />
            Import TeachWorks
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
