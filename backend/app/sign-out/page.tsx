// app/sign-out/page.tsx

"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SignOutPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    const logout = async () => {
      console.log("Sign-out page mounted");
      await signOut({
        redirectUrl: "/", // Redirect to home page after sign-out
      });
    };

    logout();
  }, [signOut]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {/* Spinner */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Signing you out...
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          You don&apos;t have permission to access the admin dashboard.
          <br />
          Redirecting you to the home page.
        </p>

        <div className="mt-8">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-900" />
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">Please wait a moment...</p>
      </div>
    </main>
  );
}
