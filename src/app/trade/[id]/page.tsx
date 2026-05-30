import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { TradeOnchainPanel } from "@/components/trade-onchain-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { shortenAddress } from "@/lib/arc";
import { TradeWithListing, formatPriceLabel } from "@/lib/marketplace";

type TradeDetailResponse = TradeWithListing;

async function getTrade(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/trades/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load trade");
  }

  return (await response.json()) as TradeDetailResponse;
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTrade(id);

  if (!trade) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader />

      <section className="mb-8 rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-[0_20px_80px_-44px_rgba(15,118,110,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge className="rounded-full">Arc SafeTrade</Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              Trade #{trade.id.slice(0, 8)}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              This page tracks the local database record for the escrow flow.
              Wallet-based onchain actions are still expected to happen from the
              frontend wallet layer.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full text-sm">
            {trade.status}
          </Badge>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle>{trade.listing.title}</CardTitle>
            <CardDescription>{trade.listing.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Escrow amount
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatPriceLabel(trade.amount)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="mt-1 font-medium">
                  {shortenAddress(trade.buyerAddress)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="mt-1 font-medium">
                  {shortenAddress(trade.sellerAddress)}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Local trade id</p>
                <p className="mt-1 font-medium break-all">{trade.id}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Contract trade id</p>
                <p className="mt-1 font-medium">
                  {trade.contractTradeId ?? "Not created yet"}
                </p>
              </div>
            </div>
            {trade.trackingNumber ? (
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Tracking number</p>
                <p className="mt-1 font-medium">{trade.trackingNumber}</p>
              </div>
            ) : null}
            {trade.disputeReason ? (
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Dispute reason</p>
                <p className="mt-1 leading-6">{trade.disputeReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <TradeOnchainPanel trade={trade} />
      </div>
    </main>
  );
}
