import { notFound } from "next/navigation";
import { CircleDollarSign, PackageCheck, Scale, ShieldCheck } from "lucide-react";

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
import { getDb } from "@/lib/db";
import { TradeWithListing, formatPriceLabel } from "@/lib/marketplace";

type TradeDetailResponse = TradeWithListing;

function getStatusExplanation(status: TradeWithListing["status"]) {
  switch (status) {
    case "CREATED":
      return "Escrow has been created. Buyer needs to fund it.";
    case "FUNDED":
      return "USDC is locked. Seller can now ship.";
    case "SHIPPED":
      return "Item marked as shipped. Waiting for buyer confirmation.";
    case "COMPLETED":
      return "Delivery confirmed. Funds released to seller.";
    case "DISPUTED":
      return "Dispute opened. Admin review required.";
    case "REFUNDED":
      return "Dispute resolved. Funds returned to buyer.";
    case "CANCELLED":
      return "Trade cancelled before completion.";
    default:
      return "Trade status is available below.";
  }
}

async function getTrade(id: string) {
  const db = getDb();
  const trade = await db.trade.findUnique({
    where: { id },
    include: { listing: true },
  });

  if (!trade) {
    return null;
  }

  return JSON.parse(JSON.stringify(trade)) as TradeDetailResponse;
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
              SafeTrade Escrow
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              Trade #{trade.id.slice(0, 8)} tracks the escrow lifecycle between
              buyer and seller, from funding through shipping, confirmation, or
              dispute resolution.
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
            <CardTitle>Trade summary</CardTitle>
            <CardDescription>
              Status, parties, amount, and the escrow explanation for this SafeTrade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status explanation</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {getStatusExplanation(trade.status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Listing</p>
                <p className="mt-1 font-medium">{trade.listing.title}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 font-medium">{formatPriceLabel(trade.amount)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="mt-1 font-medium">{shortenAddress(trade.buyerAddress)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="mt-1 font-medium">{shortenAddress(trade.sellerAddress)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Trade status</p>
                <p className="mt-1 font-medium">{trade.status}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Contract trade id</p>
                <p className="mt-1 font-medium">
                  {trade.contractTradeId ?? "Not created yet"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CircleDollarSign className="size-4 text-primary" />
                  Escrow amount
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Buyer funds this amount in USDC before shipping.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PackageCheck className="size-4 text-primary" />
                  Seller shipment
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Seller ships only after escrow is visibly funded.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Scale className="size-4 text-primary" />
                  Dispute safety
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  If delivery goes wrong, admin can resolve the escrow onchain.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Listing description</p>
              <p className="mt-1 leading-6">{trade.listing.description}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Local trade id</p>
              <p className="mt-1 break-all font-medium">{trade.id}</p>
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
