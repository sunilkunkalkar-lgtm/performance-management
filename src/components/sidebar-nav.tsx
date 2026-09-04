"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/hr-nav";

export function SidebarNav({
  items,
  settings,
}: {
  items: NavItem[];
  settings?: NavItem;
}) {
  const pathname = usePathname();

  function linkClass(href: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      active
        ? "bg-white/15 text-paper"
        : "text-paper/80 hover:bg-white/10 hover:text-paper"
    }`;
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </nav>
      {settings ? (
        <nav className="mt-auto border-t border-white/10 px-3 py-3">
          <Link href={settings.href} className={linkClass(settings.href)}>
            <settings.icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{settings.label}</span>
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
