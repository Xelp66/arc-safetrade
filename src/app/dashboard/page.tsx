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
          Monitor listings and SafeTrade activity by wallet.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Listings created by the connected address appear first, followed by
          Buying and Selling tabs for escrow trade records.
        </p>
      </section>

      <DashboardView />
    </main>
  );
}
