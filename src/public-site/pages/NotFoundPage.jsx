import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "../../shared/branding";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
        <div className="mx-auto w-fit">
          <BrandLogo
            variant="light"
            markVariant="primary"
            markSurface
            size="lg"
            showAttribution
            attribution="Enterprise"
          />
        </div>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-indigo-300">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          Page not found
        </h1>

        <p className="mt-4 text-base font-medium leading-7 text-slate-400">
          The requested SchoolOS page does not exist or has not yet
          been published.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-indigo-700"
          >
            <Home size={17} />
            Return home
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-black text-white"
          >
            <ArrowLeft size={17} />
            Go back
          </button>
        </div>
      </div>
    </main>
  );
}