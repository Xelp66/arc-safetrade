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
import { Listing, Trade, formatPriceLabel } from "@/lib/marketplace";
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

export function SellerListingsPanel() {
  const router = useRouter();
  const { address } = useAccount();
  const [listings, setListings] = useState<SellerManagedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      {listings.map((listing) => {
        const editAllowed = canEditListing(listing, listing.trades);
        const cancelAllowed = canCancelListing(listing, listing.trades);
        const editReason = getEditListingBlockReason(listing, listing.trades);
        const cancelReason = getCancelListingBlockReason(listing, listing.trades);

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
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/listing/${listing.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                >
                  View
                </Link>
                {editAllowed ? (
                  <Link
                    href={`/listing/${listing.id}/edit`}
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                  >
                    Edit
                  </Link>
                ) : null}
                {listing.status === "ACTIVE" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => handleCancel(listing)}
                    disabled={!cancelAllowed || cancellingId === listing.id}
                  >
                    {cancellingId === listing.id ? "Cancelling..." : "Cancel"}
                  </Button>
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
