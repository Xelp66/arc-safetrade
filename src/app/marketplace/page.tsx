import { Badge } from "@/components/ui/badge";
import { MarketplaceGrid } from "@/components/marketplace-grid";
import { SiteHeader } from "@/components/site-header";

export default function MarketplacePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/marketplace" />

      <section className="mb-8 rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-[0_20px_80px_-44px_rgba(15,118,110,0.45)]">
        <div className="space-y-4">
          <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
            Arc Marketplace
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Browse active listings backed by SafeTrade escrow.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Every purchase flow is designed to move into escrow instead of direct
            payment. Arc Network usage stays visible at every step.
          </p>
        </div>
      </section>

      <MarketplaceGrid />
    </main>
  );
}
