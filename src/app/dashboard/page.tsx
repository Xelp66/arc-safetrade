import { Badge } from "@/components/ui/badge";
import { DashboardView } from "@/components/dashboard-view";
import { SiteHeader } from "@/components/site-header";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/dashboard" />

      <section className="mb-8 space-y-4">
        <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
          Wallet dashboard
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Manage listings, purchases, and escrow activity in one place.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Manage your listings, shipments, purchases, and escrow activity from one
          place. The connected wallet determines what you can create, ship,
          confirm, or dispute.
        </p>
      </section>

      <DashboardView />
    </main>
  );
}
