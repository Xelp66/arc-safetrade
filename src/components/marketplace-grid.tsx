"use client";

import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";

import { Listing } from "@/lib/marketplace";
import { ListingCard } from "@/components/listing-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MarketplaceGrid({
  sellerAddress,
}: {
  sellerAddress?: string;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadListings() {
      setIsLoading(true);
      setError(null);

      const query = sellerAddress
        ? `?sellerAddress=${encodeURIComponent(sellerAddress)}`
        : "";

      try {
        const response = await fetch(`/api/listings${query}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load listings");
        }

        const data = (await response.json()) as Listing[];

        if (!isCancelled) {
          setListings(data);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unexpected error while loading listings",
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
  }, [sellerAddress]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={index}
            className="h-[24rem] rounded-[1.5rem] border border-border/70 bg-card/70"
          >
            <CardContent className="h-full animate-pulse p-0" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-[1.5rem] border border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Could not load listings</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="rounded-[1.5rem] border border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="size-5 text-primary" />
            No active listings yet
          </CardTitle>
          <CardDescription>
            This testnet marketplace is empty for now. Create the first listing
            from the Sell page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
