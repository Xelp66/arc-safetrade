"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import {
  canCancelListing,
  canEditListing,
  getCancelListingBlockReason,
  getEditListingBlockReason,
} from "@/lib/listing-management";
import { shortenAddress } from "@/lib/arc";
import { Listing, Trade, formatPriceLabel } from "@/lib/marketplace";
import { SellerTradeActions } from "@/components/seller-trade-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SellerManagedListing = Listing & { trades: Trade[] };

function getTradeStatusLabel(trade: Trade | null, listing: SellerManagedListing) {
  if (trade?.status === "SHIPPED") {
    return "Waiting for buyer confirmation";
  }

  if (trade?.status === "DISPUTED") {
    return "Dispute opened";
  }

  if (trade?.status === "COMPLETED" || listing.status === "SOLD") {
    return "Completed";
  }

  if (listing.status === "CANCELLED") {
    return "Cancelled";
  }

  if (trade) {
    return trade.status;
  }

  return listing.status === "ACTIVE" ? "Listed" : listing.status;
}

export function SellerListingsPanel() {
  const router = useRouter();
  const { address } = useAccount();
  const [listings, setListings] = useState<SellerManagedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    const normalizedAddress = address.toLowerCase();
    let isCancelled = false;

    async function loadListings() {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const response = await fetch(
          `/api/listings/manage?sellerAddress=${encodeURIComponent(normalizedAddress)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load seller listings");
        }

        const data = (await response.json()) as SellerManagedListing[];

        if (!isCancelled) {
          setListings(data);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unexpected error while loading seller listings",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadListings();

    return () => {
      isCancelled = true;
    };
  }, [address]);

  async function handleCancel(listing: SellerManagedListing) {
    const confirmed = window.confirm(
      "This will remove the listing from the marketplace. You can only cancel listings without active trades.",
    );

    if (!confirmed || !address) {
      return;
    }

    setCancellingId(listing.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerAddress: address,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel listing");
      }

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id ? { ...item, status: "CANCELLED" } : item,
        ),
      );
      setSuccessMessage("Listing removed from the marketplace.");
      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unexpected error while cancelling listing",
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading listings...</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="rounded-[1.25rem] border border-border/70 bg-background/50">
        <CardHeader>
          <CardTitle className="text-base">No seller listings yet</CardTitle>
          <CardDescription>
            Listings created by your connected wallet will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {listings.map((listing) => {
        const latestTrade = listing.trades[0] ?? null;
        const editAllowed = canEditListing(listing, listing.trades);
        const cancelAllowed = canCancelListing(listing, listing.trades);
        const editReason = getEditListingBlockReason(listing, listing.trades);
        const cancelReason = getCancelListingBlockReason(listing, listing.trades);
        const hasTrade = latestTrade !== null;
        const showManagementActions = listing.status === "ACTIVE" && !hasTrade;
        const statusLabel = getTradeStatusLabel(latestTrade, listing);

        return (
          <Card
            key={listing.id}
            className="rounded-[1.25rem] border border-border/70 bg-background/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-base">{listing.title}</CardTitle>
                  <CardDescription>{formatPriceLabel(listing.price)}</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {listing.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Listing
                      </p>
                      <p className="mt-2 text-sm font-medium">{statusLabel}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Buyer
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {latestTrade ? shortenAddress(latestTrade.buyerAddress) : "No buyer yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Trade status
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {latestTrade ? latestTrade.status : "No trade"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Contract tradeId
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {latestTrade?.contractTradeId ?? "Not created"}
                      </p>
                    </div>
                  </div>

                  {latestTrade ? (
                    <p className="text-sm text-muted-foreground">
                      Trade #{latestTrade.id.slice(0, 8)} is linked to this listing.
                    </p>
                  ) : null}

                  {latestTrade ? (
                    <SellerTradeActions
                      trade={latestTrade}
                      status={latestTrade.status}
                      contractTradeId={latestTrade.contractTradeId}
                      initialTrackingNumber={latestTrade.trackingNumber}
                      compact
                      onShipped={({ shippedTxHash, trackingNumber }) => {
                        setSuccessMessage("Shipment recorded on Arc.");
                        setListings((current) =>
                          current.map((item) => {
                            if (item.id !== listing.id || item.trades.length === 0) {
                              return item;
                            }

                            const [mostRecentTrade, ...restTrades] = item.trades;

                            return {
                              ...item,
                              trades: [
                                {
                                  ...mostRecentTrade,
                                  status: "SHIPPED",
                                  shippedTxHash,
                                  trackingNumber,
                                },
                                ...restTrades,
                              ],
                            };
                          }),
                        );
                      }}
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                  <Link
                    href={`/listing/${listing.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                  >
                    View Listing
                  </Link>
                  {latestTrade ? (
                    <Link
                      href={`/trade/${latestTrade.id}`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                    >
                      View Trade
                    </Link>
                  ) : null}
                  {showManagementActions && editAllowed ? (
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                    >
                      Edit Listing
                    </Link>
                  ) : null}
                  {showManagementActions ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-full"
                      onClick={() => handleCancel(listing)}
                      disabled={!cancelAllowed || cancellingId === listing.id}
                    >
                      {cancellingId === listing.id ? "Cancelling..." : "Cancel Listing"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {latestTrade?.status === "SHIPPED" ? (
                  <p className="text-sm text-muted-foreground">
                    Waiting for buyer confirmation on the funded SafeTrade.
                  </p>
                ) : null}
                {latestTrade?.status === "DISPUTED" ? (
                  <p className="text-sm text-muted-foreground">
                    Dispute opened. Continue in the trade detail page for updates.
                  </p>
                ) : null}
              </div>

              {!editAllowed && editReason ? (
                <p className="text-sm text-muted-foreground">{editReason}</p>
              ) : null}
              {listing.status === "ACTIVE" && !cancelAllowed && cancelReason ? (
                <p className="text-sm text-muted-foreground">{cancelReason}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
