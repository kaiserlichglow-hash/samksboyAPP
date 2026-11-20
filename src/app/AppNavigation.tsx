
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/", label: "Início", icon: "⌂" },
  { href: "/workouts", label: "Academia", icon: "◆" },
  { href: "/sleep", label: "Sono", icon: "☾" },
  { href: "/investments", label: "Investimentos", icon: "◈" },
  { href: "/markets", label: "Mercados", icon: "▥" },
  { href: "/reminders", label: "Lembretes", icon: "◷" },
  { href: "/chess", label: "Xadrez", icon: "♞" },
];

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-10">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {pages.map((page) => {
          const active = pathname === page.href;

          return (
            <Link
              key={page.href}
              href={page.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition ${
                active
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-[#141414] text-zinc-400 hover:border-white/30 hover:text-white"
              }`}
            >
              <span className="text-2xl">{page.icon}</span>
              <span className="text-xs font-medium">{page.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
