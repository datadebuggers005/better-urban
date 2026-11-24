"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, HandHeart, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/my-reports", label: "My Reports", icon: FileText },
  { href: "/volunteer", label: "Volunteer", icon: HandHeart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-line bg-paper/95 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active =
            item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 text-[10.5px] font-medium transition",
                  active ? "text-ink" : "text-muted hover:text-ink/70",
                )}
              >
                <Icon className="size-[19px]" strokeWidth={active ? 2.1 : 1.6} />
                {item.label}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full transition",
                    active ? "bg-ink" : "bg-transparent",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
