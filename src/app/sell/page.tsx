import { Badge } from "@/components/ui/badge";
import { SellForm } from "@/components/sell-form";
import { SiteHeader } from "@/components/site-header";

export default function SellPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/sell" />

      <section className="mb-8 space-y-4">
        <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
          Sell on Arc Testnet
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          List an item with escrow-ready trade flow.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
          Sellers publish inventory first. Buyers reserve listings, then the
          wallet-based Arc SafeTrade flow takes over for funding and delivery.
        </p>
      </section>

      <SellForm />
    </main>
  );
}
