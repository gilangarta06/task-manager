"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  FolderKanban,
  CalendarDays,
  BarChart3,
  Activity,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/app/actions";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/board", label: "Papan", icon: KanbanSquare },
  { href: "/tasks", label: "Daftar Tugas", icon: ListTodo },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/projects", label: "Proyek", icon: FolderKanban },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/activity", label: "Aktivitas", icon: Activity },
];

export function Sidebar({
  user,
}: {
  user: { name: string; email: string; color: string; role: string };
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setExpanded(false);
  }

  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const label = (text: string) => (
    <span className={cn(expanded ? "inline" : "hidden lg:inline")}>{text}</span>
  );

  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors",
      expanded ? "px-2.5" : "justify-center px-0 lg:justify-start lg:px-2.5",
      active
        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    );

  return (
    <>
      {expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:w-60",
          expanded ? "w-60" : "w-14"
        )}
      >
        <div className="flex h-svh flex-col gap-1 p-2 lg:p-3">
          <div
            className={cn(
              "flex items-center gap-2 py-1",
              expanded ? "px-1" : "justify-center px-0 lg:justify-start lg:px-1"
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <svg viewBox="0 0 12 12" className="size-4" aria-hidden="true">
                <path
                  d="M1.5 6.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={cn("text-sm font-semibold", expanded ? "inline" : "hidden lg:inline")}>
              Task Manager
            </span>
            {expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Tutup menu"
                className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Buka menu"
              className="mt-1 flex items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            >
              <Menu className="size-[18px]" />
            </button>
          ) : null}

          <nav className="mt-3 flex flex-1 flex-col gap-1">
            {LINKS.map(({ href, label: text, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={text}
                className={itemClass(isActive(href))}
              >
                <Icon className="size-[18px] shrink-0" />
                {label(text)}
              </Link>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-1 border-t border-sidebar-border pt-3">
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Ganti tema"
              className={itemClass(false)}
            >
              <Sun className="size-[18px] shrink-0 dark:hidden" />
              <Moon className="hidden size-[18px] shrink-0 dark:block" />
              {label("Ganti tema")}
            </button>
            <form action={logoutAction}>
              <button type="submit" title="Keluar" className={cn(itemClass(false), "w-full")}>
                <LogOut className="size-[18px] shrink-0" />
                {label("Keluar")}
              </button>
            </form>
            <div
              className={cn(
                "mt-2 flex items-center gap-2 py-1",
                expanded ? "px-2.5" : "justify-center px-0 lg:justify-start lg:px-2.5"
              )}
            >
              <Avatar name={user.name} color={user.color} />
              <div className={cn("min-w-0", expanded ? "block" : "hidden lg:block")}>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.role === "OWNER" ? "Owner" : "Pekerja"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
