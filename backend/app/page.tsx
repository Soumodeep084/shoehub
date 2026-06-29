import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] selection:bg-zinc-800 selection:text-white">
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

      <section className="relative z-10 w-full max-w-4xl px-6 my-12">
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/40 p-10 backdrop-blur-xl shadow-2xl">
          {/* Top Header / Logo Bar */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-8 mb-10">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm font-medium text-zinc-200">
                SH
              </div>
              <div>
                <p className="text-sm font-medium tracking-tight text-zinc-100">
                  ShoeHub
                </p>
                <p className="text-xs text-zinc-500">Administration</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-400">
              <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
              Internal Portal
            </span>
          </div>

          {/* Core Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-normal tracking-tight text-zinc-100 sm:text-4xl leading-[1.15]">
              Manage your entire{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-100 via-zinc-200 to-zinc-400 font-medium">
                sneaker business
              </span>{" "}
              from one place.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              Secure administration portal built for tracking inventory,
              customer orders, product catalogs, and operational metrics across
              the enterprise ecosystem.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/sign-in"
                className="rounded-xl bg-zinc-100 px-5 py-2.5 text-xs font-medium text-zinc-950 transition-all duration-200 hover:bg-white hover:scale-[1.01] active:scale-[0.99] shadow-sm"
              >
                Continue to Admin
              </Link>

              <div className="text-[11px] text-zinc-500 tracking-wide">
                Protected via Clerk Auth
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-16 border-t border-zinc-900 pt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="group">
                <div className="inline-flex items-center text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Products
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Inventory, structured pricing models, and live stock
                  adjustments.
                </p>
              </div>

              <div className="group">
                <div className="inline-flex items-center text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Orders
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Real-time pipeline monitoring, fulfillment, and customer
                  tracking.
                </p>
              </div>

              <div className="group">
                <div className="inline-flex items-center text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  Analytics
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Core volume insights, operational performance, and gross
                  revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
