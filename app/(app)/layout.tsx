import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh bg-muted/30">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
