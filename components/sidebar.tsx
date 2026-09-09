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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <>
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden="true">
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
        <span className="text-sm font-semibold">Task Manager</span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isActive(href)
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-sidebar-border pt-3">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Sun className="size-4 shrink-0 dark:hidden" />
          <Moon className="hidden size-4 shrink-0 dark:block" />
          Ganti tema
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4 shrink-0" />
            Keluar
          </button>
        </form>
        <div className="mt-2 flex items-center gap-2 px-2.5 py-1">
          <Avatar name={user.name} color={user.color} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.role === "OWNER" ? "Owner" : "Pekerja"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-sm font-semibold">Task Manager</span>
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 flex h-svh flex-col p-3">{nav}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </button>
            {nav}
          </div>
        </div>
      ) : null}
    </>
  );
}
