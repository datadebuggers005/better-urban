"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, HandHeart, Home, MapPin, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const isStaff = user?.role === "officer" || user?.role === "admin";

  const items = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/map", label: "Live Map", icon: MapPin },
    { href: "/my-reports", label: "Reports", icon: FileText },
    isStaff
      ? { href: "/admin", label: "Admin", icon: ShieldCheck }
      : { href: "/volunteer", label: "Volunteer", icon: HandHeart },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-line bg-paper/95 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 text-[10.5px] font-medium transition",
                  active ? "text-primary" : "text-muted hover:text-ink/70",
                )}
              >
                <Icon className="size-[19px]" strokeWidth={active ? 2.1 : 1.6} />
                {item.label}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full transition",
                    active ? "bg-primary" : "bg-transparent",
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
