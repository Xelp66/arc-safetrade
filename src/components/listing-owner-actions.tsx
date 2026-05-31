"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";

import {
  canCancelListing,
  canEditListing,
  getCancelListingBlockReason,
  getEditListingBlockReason,
} from "@/lib/listing-management";
import { Listing, Trade } from "@/lib/marketplace";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ListingOwnerActions({
  listing,
  trades,
  redirectTo = "/dashboard",
}: {
  listing: Listing;
  trades: Trade[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner =
    address?.toLowerCase() === listing.sellerAddress.toLowerCase();

  if (!isOwner) {
    return null;
  }

  const editAllowed = canEditListing(listing, trades);
  const cancelAllowed = canCancelListing(listing, trades);
  const editReason = getEditListingBlockReason(listing, trades);
  const cancelReason = getCancelListingBlockReason(listing, trades);

  async function handleCancel() {
    if (!cancelAllowed) {
      setError(cancelReason);
      return;
    }

    const confirmed = window.confirm(
      "This will remove the listing from the marketplace. You can only cancel listings without active trades.",
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setMessage(null);
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

      setMessage("Listing cancelled. It has been removed from the marketplace.");
      router.push(redirectTo);
      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unexpected error while cancelling the listing",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {editAllowed ? (
          <Link
            href={`/listing/${listing.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Edit Listing
          </Link>
        ) : (
          <Button type="button" variant="outline" disabled className="rounded-full">
            Edit Listing
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          onClick={handleCancel}
          disabled={!cancelAllowed || isCancelling}
          className="rounded-full"
        >
          {isCancelling ? "Cancelling..." : "Cancel Listing"}
        </Button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!editAllowed && editReason ? (
        <p className="text-sm text-muted-foreground">{editReason}</p>
      ) : null}
      {!cancelAllowed && cancelReason ? (
        <p className="text-sm text-muted-foreground">{cancelReason}</p>
      ) : null}
    </div>
  );
}
