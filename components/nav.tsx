"use client";

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

export function Nav({ user }: { user: { name: string; email: string; color: string; role: string } }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden="true">
              <path d="M1.5 6.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="hidden text-sm font-semibold sm:inline">Task Manager</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive(href)
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Ganti tema"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </button>

        <div className="flex items-center gap-2">
          <Avatar name={user.name} color={user.color} />
          <span className="hidden text-sm text-muted-foreground lg:inline">{user.name}</span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Keluar"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
