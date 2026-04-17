"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const managerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedules", label: "Schedules" },
  { href: "/staff", label: "Staff" },
  { href: "/stations", label: "Stations" },
];

const staffLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/availability", label: "My Availability" },
];

export function Nav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = role === "MANAGER" ? managerLinks : staffLinks;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-14">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900 text-sm">Shift Planner</span>
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
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        Sign out
      </button>
    </nav>
  );
}
