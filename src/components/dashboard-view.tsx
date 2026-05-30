"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { shortenAddress } from "@/lib/arc";
import { Trade, formatPriceLabel } from "@/lib/marketplace";
import { MarketplaceGrid } from "@/components/marketplace-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function TradeCard({ trade }: { trade: Trade }) {
  return (
    <Card className="rounded-[1.25rem] border border-border/70 bg-card/85">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">
            Trade #{trade.id.slice(0, 8)}
          </CardTitle>
          <Badge variant="outline" className="rounded-full">
            {trade.status}
          </Badge>
        </div>
        <CardDescription>
          Buyer {shortenAddress(trade.buyerAddress)} · Seller{" "}
          {shortenAddress(trade.sellerAddress)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Escrow amount</p>
          <p className="text-lg font-semibold">{formatPriceLabel(trade.amount)}</p>
        </div>
        <Button
          render={<Link href={`/trade/${trade.id}`} />}
          variant="outline"
          className="rounded-full"
        >
          Open trade
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"buying" | "selling">("buying");
  const [buyingTrades, setBuyingTrades] = useState<Trade[]>([]);
  const [sellingTrades, setSellingTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    const normalizedAddress = address.toLowerCase();
    let isCancelled = false;

    async function loadTrades() {
      setIsLoadingTrades(true);
      setTradeError(null);

      try {
        const response = await fetch(
          `/api/trades?address=${encodeURIComponent(normalizedAddress)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load trades");
        }

        const data = (await response.json()) as {
          buying: Trade[];
          selling: Trade[];
        };

        if (!isCancelled) {
          setBuyingTrades(data.buying);
          setSellingTrades(data.selling);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setTradeError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unexpected error while loading trades",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTrades(false);
        }
      }
    }

    void loadTrades();

    return () => {
      isCancelled = true;
    };
  }, [address]);

  if (!isConnected || !address) {
    return (
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Connect your wallet</CardTitle>
          <CardDescription>
            The dashboard is scoped to the currently connected address.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visibleTrades = activeTab === "buying" ? buyingTrades : sellingTrades;

  return (
    <div className="space-y-8">
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>My listings</CardTitle>
          <CardDescription>
            Listings published by {shortenAddress(address)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketplaceGrid sellerAddress={address.toLowerCase()} />
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Trade activity</CardTitle>
              <CardDescription>
                Split into buying and selling views for the connected wallet.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={activeTab === "buying" ? "secondary" : "outline"}
                className="rounded-full"
                onClick={() => setActiveTab("buying")}
              >
                Buying
              </Button>
              <Button
                type="button"
                variant={activeTab === "selling" ? "secondary" : "outline"}
                className="rounded-full"
                onClick={() => setActiveTab("selling")}
              >
                Selling
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingTrades ? (
            <p className="text-sm text-muted-foreground">Loading trades...</p>
          ) : null}

          {tradeError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {tradeError}
            </div>
          ) : null}

          {!isLoadingTrades && visibleTrades.length === 0 ? (
            <Card className="rounded-[1.25rem] border border-border/70 bg-background/50">
              <CardHeader>
                <CardTitle className="text-base">No trades yet</CardTitle>
                <CardDescription>
                  {activeTab === "buying"
                    ? "You have not started any SafeTrade purchases yet."
                    : "No buyer has reserved one of your listings yet."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {visibleTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
