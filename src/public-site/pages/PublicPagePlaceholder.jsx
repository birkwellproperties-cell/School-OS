import { Link } from "react-router-dom";

export default function PublicPagePlaceholder({
  eyebrow,
  title,
  description,
}) {
  return (
    <section className="min-h-[70vh] bg-slate-50 px-4 pb-20 pt-36 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-12">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>

        <h1 className="mt-4 text-4xl font-black text-slate-950">
          {title}
        </h1>

        <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-500">
          {description}
        </p>

        <Link
          to="/request-access"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700"
        >
          Request Platform Access
        </Link>
      </div>
    </section>
  );
}
