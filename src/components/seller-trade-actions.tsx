"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { arcSafeTradeEscrowAbi } from "@/lib/arc-safe-trade-escrow-abi";
import { ARC_ESCROW_CONTRACT_ADDRESS, ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import type { Trade } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SellerTradeActionsProps = {
  trade: Trade;
  status: Trade["status"];
  contractTradeId: number | null;
  initialTrackingNumber?: string | null;
  onShipped?: (payload: {
    shippedTxHash: string;
    trackingNumber: string | null;
  }) => void;
  compact?: boolean;
};

export function SellerTradeActions({
  compact = false,
  contractTradeId,
  initialTrackingNumber,
  onShipped,
  status,
  trade,
}: SellerTradeActionsProps) {
  return (
    <SellerTradeActionsInner
      key={`${trade.id}:${initialTrackingNumber ?? ""}`}
      trade={trade}
      status={status}
      contractTradeId={contractTradeId}
      initialTrackingNumber={initialTrackingNumber}
      onShipped={onShipped}
      compact={compact}
    />
  );
}

function SellerTradeActionsInner({
  compact = false,
  contractTradeId,
  initialTrackingNumber,
  onShipped,
  status,
  trade,
}: SellerTradeActionsProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasPatchedRef = useRef(false);

  const isSeller = address?.toLowerCase() === trade.sellerAddress.toLowerCase();
  const isOnArc = chainId === ARC_TESTNET_CHAIN_ID;
  const escrowAddressConfigured =
    ARC_ESCROW_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const {
    data: txHash,
    isPending: isWriting,
    error: writeError,
    writeContract,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    chainId: ARC_TESTNET_CHAIN_ID,
    hash: txHash,
  });

  useEffect(() => {
    async function persistShipment() {
      if (!receipt || !txHash || hasPatchedRef.current) {
        return;
      }

      hasPatchedRef.current = true;

      try {
        const trimmedTrackingNumber = trackingNumber.trim();
        const response = await fetch(`/api/trades/${trade.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "SHIPPED",
            sellerAddress: trade.sellerAddress,
            shippedTxHash: txHash,
            trackingNumber: trimmedTrackingNumber || undefined,
          }),
        });

        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Failed to save shipped trade");
        }

        setSuccessMessage("Shipment recorded on Arc.");
        setError(null);
        onShipped?.({
          shippedTxHash: txHash,
          trackingNumber: trimmedTrackingNumber || null,
        });
        router.refresh();
      } catch (persistError) {
        hasPatchedRef.current = false;
        setError(
          persistError instanceof Error
            ? persistError.message
            : "Unexpected error while saving shipped trade",
        );
      }
    }

    void persistShipment();
  }, [onShipped, receipt, router, trackingNumber, trade.id, trade.sellerAddress, txHash]);

  if (status !== "FUNDED" || !isSeller) {
    return null;
  }

  const isBusy = isWriting || isConfirming;
  const displayError = error || writeError?.message || receiptError?.message || null;
  const wrapperClassName = compact
    ? "space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4"
    : "space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4";

  function handleMarkShipped() {
    if (!isConnected || !address) {
      setError("Connect the seller wallet before marking shipment.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before marking shipment.");
      return;
    }

    if (!escrowAddressConfigured) {
      setError("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS is not configured.");
      return;
    }

    if (contractTradeId === null) {
      setError("Onchain escrow must exist before shipping.");
      return;
    }

    hasPatchedRef.current = false;
    setError(null);
    setSuccessMessage(null);

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "markShipped",
      args: [BigInt(contractTradeId)],
    });
  }

  return (
    <div className={wrapperClassName}>
      {isConnected && !isOnArc ? (
        <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-900">
            Wrong network detected. Switch to Arc Testnet to mark this trade as
            shipped.
          </p>
          <Button
            type="button"
            onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
            disabled={isSwitchingChain}
            className="w-full rounded-full"
          >
            {isSwitchingChain ? "Switching..." : "Switch to Arc Testnet"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium">Tracking number (optional)</label>
        <Input
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="Carrier reference"
        />
      </div>

      <Button
        type="button"
        onClick={handleMarkShipped}
        disabled={isBusy || !isOnArc}
        className="w-full rounded-full"
      >
        {isBusy
          ? isWriting
            ? "Confirm shipment in wallet..."
            : "Waiting for shipped receipt..."
          : "Mark as Shipped"}
      </Button>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {displayError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {displayError}
        </div>
      ) : null}
    </div>
  );
}
