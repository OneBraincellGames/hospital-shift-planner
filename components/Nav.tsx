"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/server";

export function Nav({ role, locale }: { role: string; locale: Locale }) {
  const pathname = usePathname();
  const t = useT();

  const managerLinks = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/schedules", label: t.nav.schedules },
    { href: "/swaps", label: t.nav.swaps },
    { href: "/leave", label: t.nav.leave },
    { href: "/staff", label: t.nav.staff },
    { href: "/stations", label: t.nav.stations },
    { href: "/planner-config", label: t.nav.plannerConfig },
  ];

  const staffLinks = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/my-shifts", label: t.nav.myShifts },
    { href: "/my-shifts/open-swaps", label: t.nav.openSwaps },
    { href: "/availability", label: t.nav.availability },
  ];

  const links = role === "MANAGER" ? managerLinks : staffLinks;
  const nextLocale = locale === "de" ? "en" : "de";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-14">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900 text-sm">{t.nav.appName}</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm ${
              pathname.startsWith(l.href) && l.href !== "/dashboard"
                ? "text-blue-600 font-medium"
                : pathname === l.href
                ? "text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <a
          href={`/api/locale?set=${nextLocale}&back=${pathname}`}
          className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-0.5"
        >
          {nextLocale.toUpperCase()}
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          {t.nav.signOut}
        </button>
      </div>
    </nav>
  );
}
