import { Badge } from "@/components/ui/badge";
import { MarketplaceGrid } from "@/components/marketplace-grid";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";

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
            Buy second-hand items with escrow protection.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Listings can be purchased through SafeTrade, where USDC is locked until
            delivery is confirmed. Browse items first, then move into protected
            escrow instead of direct payment.
          </p>
        </div>
      </section>

      <Card className="mb-8 rounded-[1.5rem] border border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Buy with escrow protection</p>
            <p className="text-sm leading-6 text-muted-foreground">
              SafeTrade locks USDC on Arc before the seller ships, so both sides can
              trade with proof instead of blind trust.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full bg-background/70">
            USDC escrow on Arc Testnet
          </Badge>
        </CardContent>
      </Card>

      <MarketplaceGrid />
    </main>
  );
}
