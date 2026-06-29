"use client";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(39,39,42,0.4),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03),transparent_70%)]" />

      {/* Ultra-subtle Grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right,#fff 1px,transparent 1px),
            linear-gradient(to bottom,#fff 1px,transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <section className="relative z-10 w-full max-w-md px-6">
        {/* Card Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm font-semibold text-white">
              SH
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                ShoeHub
              </h1>
              <p className="text-xs text-zinc-500">Administrator Portal</p>
            </div>
          </div>

          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
        </div>

        {/* Clerk Card */}
        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/30 p-2 backdrop-blur-xl shadow-2xl">
          <SignIn
          forceRedirectUrl="/auth/callback"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none border-none",
              },
            }}
          />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Protected by Clerk Authentication
        </p>
      </section>
    </main>
  );
}
