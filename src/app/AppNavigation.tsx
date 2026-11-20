
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Dumbbell,
  Moon,
  CircleDollarSign,
  ChartNoAxesCombined,
  Clock3,
  Medal,
  NotebookPen,
} from "lucide-react";

function RunningIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16.5" cy="4" r="2" />
      <path d="m13 9 3 2 4-1" />
      <path d="m13 9-4 4-4 1" />
      <path d="m13 9 2 6-4 6" />
      <path d="m15 15 5 5" />
    </svg>
  );
}

const pages = [
  { href: "/", label: "Início", icon: House },
  { href: "/workouts", label: "Academia", icon: Dumbbell },
  { href: "/running", label: "Corrida", icon: Medal },
  { href: "/sleep", label: "Sono", icon: Moon },
  {
    href: "/investments",
    label: "Investimentos",
    icon: CircleDollarSign,
  },
  {
    href: "/markets",
    label: "Mercados",
    icon: ChartNoAxesCombined,
  },
 
  { href: "/reminders", label: "Lembretes", icon: Clock3 },
  { href: "/notes", label: "Notas", icon: NotebookPen },
];
export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-10"
    >
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {pages.map((page) => {
          const active = pathname === page.href;
          const Icon = page.icon;

          return (
            <Link
              key={page.href}
              href={page.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                active
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-[#141414] text-zinc-300 hover:border-white/30 hover:text-white"
              }`}
            >
              <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
              <span className="text-xs font-medium">
                {page.label}
              </span>
            </Link>
          );
        })}

        <Link
          href="/chess"
          aria-current={pathname === "/chess" ? "page" : undefined}
          className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
            pathname === "/chess"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-[#141414] text-zinc-300 hover:border-white/30 hover:text-white"
          }`}
        >
          <span className="text-2xl" aria-hidden="true">
            ♞
          </span>
          <span className="text-xs font-medium">Xadrez</span>
        </Link>
      </div>
    </nav>
  );
}
