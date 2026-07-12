import { School } from "lucide-react";
import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["Overview", "/platform"],
      ["Solutions", "/solutions"],
      ["Pricing", "/pricing"],
      ["Security", "/security"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Documentation", "/resources"],
      ["Contact", "/contact"],
      ["Request Access", "/request-access"],
      ["Sign In", "/login"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Tavaro Group", "/about"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["System Status", "/status"],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <School size={24} strokeWidth={2.5} />
            </span>

            <div>
              <p className="text-lg font-black">
                SchoolOS
              </p>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
                Enterprise
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-md text-sm font-medium leading-7 text-slate-400">
            A secure enterprise operating system connecting school
            administration, academics, finance, people, operations,
            analytics, and communications.
          </p>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            A Tavaro Group LLC platform
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-black text-white">
                {group.title}
              </p>

              <div className="mt-4 space-y-3">
                {group.links.map(([label, path]) => (
                  <Link
                    key={path}
                    to={path}
                    className="block text-sm font-semibold text-slate-400 transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs font-semibold text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            Â© {new Date().getFullYear()} Tavaro Group LLC. All rights reserved.
          </p>

          <p>
            SchoolOS Enterprise Version 1
          </p>
        </div>
      </div>
    </footer>
  );
}
