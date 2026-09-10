import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-svh bg-muted/30 pl-14 lg:pl-60">
      <Sidebar user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
