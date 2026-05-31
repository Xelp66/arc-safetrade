"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TradeCreationPanel({
  listingId,
  sellerAddress,
  listingStatus,
}: {
  listingId: string;
  sellerAddress: string;
  listingStatus: "ACTIVE" | "RESERVED" | "SOLD" | "CANCELLED";
}) {
  const router = useRouter();
  const { address, isConnected, status } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedAddress = address?.toLowerCase();
  const isSeller = normalizedAddress === sellerAddress.toLowerCase();
  const listingIsActive = listingStatus === "ACTIVE";
  const isReconnecting = status === "reconnecting";

  async function startTrade() {
    if (!address) {
      setError("Connect your wallet before starting SafeTrade.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await fetch("/api/users/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
        }),
      });

      const response = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          buyerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create trade");
      }

      router.push(`/trade/${data.id}`);
    } catch (tradeError) {
      setError(
        tradeError instanceof Error
          ? tradeError.message
          : "Unexpected error while starting the trade",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSeller) {
    return (
      <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Seller panel</CardTitle>
          <CardDescription>
            This is your listing. Buyers will reserve it first, then you can
            continue the shipment step from the dashboard or trade page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
      <CardHeader>
        <CardTitle>Start SafeTrade</CardTitle>
        <CardDescription>
          Create an offchain trade record first. Wallet-based escrow funding
          happens afterwards from the trade flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!listingIsActive ? (
          <p className="text-sm text-muted-foreground">
            This listing is no longer active, so new SafeTrade reservations are
            disabled.
          </p>
        ) : null}

        {isReconnecting ? (
          <p className="text-sm text-muted-foreground">
            Reconnecting wallet session...
          </p>
        ) : null}

        {!isConnected && !isReconnecting ? (
          <p className="text-sm text-muted-foreground">
            Connect your wallet to reserve this listing safely.
          </p>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={startTrade}
          disabled={!isConnected || isSubmitting || !listingIsActive || isReconnecting}
          className="w-full rounded-full"
        >
          {isSubmitting ? "Starting..." : "Start SafeTrade"}
        </Button>
      </CardContent>
    </Card>
  );
}
