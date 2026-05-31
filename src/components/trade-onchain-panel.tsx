"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeEventLog, type Address, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { TradeTimeline } from "@/components/trade-timeline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { arcSafeTradeEscrowAbi } from "@/lib/arc-safe-trade-escrow-abi";
import {
  ARC_ESCROW_CONTRACT_ADDRESS,
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  formatUsdc,
  getArcTxUrl,
  parseUsdc,
  shortenAddress,
} from "@/lib/arc";
import { erc20Abi } from "@/lib/erc20-abi";
import { Trade } from "@/lib/marketplace";

type TradeAction =
  | "create"
  | "approve"
  | "fund"
  | "ship"
  | "complete"
  | "dispute"
  | null;

const faucetUrl = "https://faucet.circle.com";
const onchainStatusLabels = [
  "Created",
  "Funded",
  "Shipped",
  "Completed",
  "Cancelled",
  "Disputed",
  "Refunded",
] as const;

function mapOnchainStatusToLocal(status: number): Trade["status"] {
  switch (status) {
    case 0:
      return "CREATED";
    case 1:
      return "FUNDED";
    case 2:
      return "SHIPPED";
    case 3:
      return "COMPLETED";
    case 4:
      return "CANCELLED";
    case 5:
      return "DISPUTED";
    case 6:
      return "REFUNDED";
    default:
      return "CREATED";
  }
}

export function TradeOnchainPanel({
  trade,
}: {
  trade: Trade;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<TradeAction>(null);
  const [trackingNumber, setTrackingNumber] = useState(trade.trackingNumber ?? "");
  const [disputeReason, setDisputeReason] = useState(trade.disputeReason ?? "");
  const [savedStatus, setSavedStatus] = useState<Trade["status"]>(trade.status);
  const [savedContractTradeId, setSavedContractTradeId] = useState<number | null>(
    trade.contractTradeId,
  );
  const [savedCreateTxHash, setSavedCreateTxHash] = useState<string | null>(
    trade.createTxHash,
  );
  const [savedFundTxHash, setSavedFundTxHash] = useState<string | null>(
    trade.fundTxHash,
  );
  const [savedShippedTxHash, setSavedShippedTxHash] = useState<string | null>(
    trade.shippedTxHash,
  );
  const [savedCompletedTxHash, setSavedCompletedTxHash] = useState<string | null>(
    trade.completedTxHash,
  );
  const [savedDisputeTxHash, setSavedDisputeTxHash] = useState<string | null>(
    trade.disputeTxHash,
  );
  const [savedResolveTxHash] = useState<string | null>(trade.resolveTxHash);
  const [savedDisputeReason, setSavedDisputeReason] = useState<string | null>(
    trade.disputeReason,
  );
  const [isSyncingFromChain, setIsSyncingFromChain] = useState(false);
  const hasPatchedRef = useRef(false);

  const amountInUsdc = useMemo(() => parseUsdc(trade.amount), [trade.amount]);
  const isOnArc = chainId === ARC_TESTNET_CHAIN_ID;
  const isBuyer = address?.toLowerCase() === trade.buyerAddress.toLowerCase();
  const isSeller = address?.toLowerCase() === trade.sellerAddress.toLowerCase();
  const hasOnchainTrade = savedContractTradeId !== null;
  const escrowAddressConfigured =
    ARC_ESCROW_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const canOpenDispute =
    hasOnchainTrade &&
    (savedStatus === "FUNDED" || savedStatus === "SHIPPED") &&
    (isBuyer || isSeller);

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

  const displayError = error || writeError?.message || receiptError?.message || null;

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ARC_USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as Address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ARC_USDC_ADDRESS as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && escrowAddressConfigured
        ? [address as Address, ARC_ESCROW_CONTRACT_ADDRESS as Address]
        : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  });

  const { data: onchainTrade, refetch: refetchOnchainTrade } = useReadContract({
    address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
    abi: arcSafeTradeEscrowAbi,
    functionName: "getTrade",
    args: savedContractTradeId !== null ? [BigInt(savedContractTradeId)] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  });

  const hasEnoughBalance = (balance ?? BigInt(0)) >= amountInUsdc;
  const hasEnoughAllowance = (allowance ?? BigInt(0)) >= amountInUsdc;
  const onchainStatusValue =
    onchainTrade !== undefined ? Number(onchainTrade.status) : null;
  const localStatusFromChain =
    onchainStatusValue !== null ? mapOnchainStatusToLocal(onchainStatusValue) : null;
  const localStatusOutOfSync =
    localStatusFromChain !== null && localStatusFromChain !== savedStatus;
  const buyerMismatch =
    onchainTrade !== undefined &&
    onchainTrade.buyer.toLowerCase() !== trade.buyerAddress.toLowerCase();
  const sellerMismatch =
    onchainTrade !== undefined &&
    onchainTrade.seller.toLowerCase() !== trade.sellerAddress.toLowerCase();
  const amountMismatch =
    onchainTrade !== undefined && onchainTrade.amount !== amountInUsdc;
  const hasCriticalMismatch = buyerMismatch || sellerMismatch || amountMismatch;

  useEffect(() => {
    if (address && isOnArc) {
      void refetchBalance();
    }
  }, [address, isOnArc, refetchBalance]);

  useEffect(() => {
    if (address && isOnArc && escrowAddressConfigured) {
      void refetchAllowance();
    }
  }, [address, escrowAddressConfigured, isOnArc, refetchAllowance]);

  useEffect(() => {
    if (savedContractTradeId !== null && escrowAddressConfigured) {
      void refetchOnchainTrade();
    }
  }, [escrowAddressConfigured, refetchOnchainTrade, savedContractTradeId]);

  useEffect(() => {
    async function persistReceiptSideEffects() {
      if (!receipt || !txHash || hasPatchedRef.current || !currentAction) {
        return;
      }

      if (currentAction === "create") {
        const tradeCreatedLog = receipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: arcSafeTradeEscrowAbi,
              data: log.data,
              topics: log.topics,
            });

            return decoded.eventName === "TradeCreated";
          } catch {
            return false;
          }
        });

        if (!tradeCreatedLog) {
          setError("TradeCreated event not found in transaction receipt.");
          return;
        }

        const decoded = decodeEventLog({
          abi: arcSafeTradeEscrowAbi,
          data: tradeCreatedLog.data,
          topics: tradeCreatedLog.topics,
        });

        if (decoded.eventName !== "TradeCreated") {
          setError("Unexpected event decoded from receipt.");
          return;
        }

        hasPatchedRef.current = true;

        try {
          const contractTradeId = Number(decoded.args.tradeId);
          const response = await fetch(`/api/trades/${trade.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contractTradeId,
              createTxHash: txHash,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save onchain trade details");
          }

          setSavedContractTradeId(contractTradeId);
          setSavedCreateTxHash(txHash);
          setSuccessMessage("Onchain escrow created on Arc.");
          setError(null);
          setCurrentAction(null);
          void refetchOnchainTrade();
          router.refresh();
        } catch (persistError) {
          hasPatchedRef.current = false;
          setError(
            persistError instanceof Error
              ? persistError.message
              : "Unexpected error while saving contract trade ID",
          );
        }

        return;
      }

      if (currentAction === "approve") {
        hasPatchedRef.current = true;
        setSuccessMessage("USDC approval confirmed on Arc.");
        setError(null);
        setCurrentAction(null);
        setTimeout(() => {
          hasPatchedRef.current = false;
          void refetchAllowance();
          router.refresh();
        }, 0);
        return;
      }

      if (currentAction === "fund") {
        hasPatchedRef.current = true;

        try {
          const response = await fetch(`/api/trades/${trade.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "FUNDED",
              fundTxHash: txHash,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save funded trade");
          }

          setSavedFundTxHash(txHash);
          setSavedStatus("FUNDED");
          setSuccessMessage("Escrow funded with USDC on Arc.");
          setError(null);
          setCurrentAction(null);
          void Promise.all([refetchBalance(), refetchAllowance(), refetchOnchainTrade()]);
          router.refresh();
        } catch (persistError) {
          hasPatchedRef.current = false;
          setError(
            persistError instanceof Error
              ? persistError.message
              : "Unexpected error while saving funded trade",
          );
        }

        return;
      }

      if (currentAction === "ship") {
        hasPatchedRef.current = true;

        try {
          const response = await fetch(`/api/trades/${trade.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "SHIPPED",
              shippedTxHash: txHash,
              trackingNumber: trackingNumber.trim() || undefined,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save shipped trade");
          }

          setSavedShippedTxHash(txHash);
          setSavedStatus("SHIPPED");
          setSuccessMessage("Shipment recorded on Arc.");
          setError(null);
          setCurrentAction(null);
          void refetchOnchainTrade();
          router.refresh();
        } catch (persistError) {
          hasPatchedRef.current = false;
          setError(
            persistError instanceof Error
              ? persistError.message
              : "Unexpected error while saving shipped trade",
          );
        }

        return;
      }

      if (currentAction === "complete") {
        hasPatchedRef.current = true;

        try {
          const response = await fetch(`/api/trades/${trade.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "COMPLETED",
              completedTxHash: txHash,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save completed trade");
          }

          setSavedCompletedTxHash(txHash);
          setSavedStatus("COMPLETED");
          setSuccessMessage("USDC released to seller on Arc.");
          setError(null);
          setCurrentAction(null);
          void Promise.all([refetchBalance(), refetchOnchainTrade()]);
          router.refresh();
        } catch (persistError) {
          hasPatchedRef.current = false;
          setError(
            persistError instanceof Error
              ? persistError.message
              : "Unexpected error while saving completed trade",
          );
        }

        return;
      }

      if (currentAction === "dispute") {
        hasPatchedRef.current = true;

        try {
          const response = await fetch(`/api/trades/${trade.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "DISPUTED",
              disputeReason: disputeReason.trim(),
              disputeTxHash: txHash,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to save disputed trade");
          }

          setSavedDisputeTxHash(txHash);
          setSavedDisputeReason(disputeReason.trim());
          setSavedStatus("DISPUTED");
          setSuccessMessage("Dispute opened on Arc.");
          setError(null);
          setCurrentAction(null);
          void refetchOnchainTrade();
          router.refresh();
        } catch (persistError) {
          hasPatchedRef.current = false;
          setError(
            persistError instanceof Error
              ? persistError.message
              : "Unexpected error while saving disputed trade",
          );
        }
      }
    }

    void persistReceiptSideEffects();
  }, [
    currentAction,
    disputeReason,
    receipt,
    refetchAllowance,
    refetchBalance,
    refetchOnchainTrade,
    router,
    trackingNumber,
    trade.id,
    txHash,
  ]);

  function prepareAction(action: TradeAction) {
    setError(null);
    setSuccessMessage(null);
    hasPatchedRef.current = false;
    setCurrentAction(action);
  }

  async function handleSyncFromChain() {
    const latestOnchain = await refetchOnchainTrade();
    const latestStatus = latestOnchain.data?.status;

    if (latestStatus === undefined) {
      setError("Onchain status is not available yet.");
      return;
    }

    const mappedStatus = mapOnchainStatusToLocal(Number(latestStatus));

    setError(null);
    setSuccessMessage(null);
    setIsSyncingFromChain(true);

    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: mappedStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync local status from chain");
      }

      setSavedStatus(mappedStatus);
      setSuccessMessage("Local trade status synced from Arc.");
      router.refresh();
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Unexpected error while syncing from chain",
      );
    } finally {
      setIsSyncingFromChain(false);
    }
  }

  function handleCreateOnchainEscrow() {
    if (!isConnected || !address) {
      setError("Connect the buyer wallet before creating onchain escrow.");
      return;
    }

    if (!isBuyer) {
      setError("Only the buyer wallet can create the onchain escrow trade.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before creating the onchain escrow.");
      return;
    }

    if (!escrowAddressConfigured) {
      setError("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS is not configured.");
      return;
    }

    prepareAction("create");

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "createTrade",
      args: [trade.sellerAddress as Address, amountInUsdc],
    });
  }

  function handleApproveUsdc() {
    if (!isConnected || !address) {
      setError("Connect the buyer wallet before approving USDC.");
      return;
    }

    if (!isBuyer) {
      setError("Only the buyer wallet can approve USDC for this trade.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before approving USDC.");
      return;
    }

    prepareAction("approve");

    writeContract({
      address: ARC_USDC_ADDRESS as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [ARC_ESCROW_CONTRACT_ADDRESS as Address, amountInUsdc],
    });
  }

  function handleFundEscrow() {
    if (!isConnected || !address) {
      setError("Connect the buyer wallet before funding escrow.");
      return;
    }

    if (!isBuyer) {
      setError("Only the buyer wallet can fund this escrow trade.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before funding escrow.");
      return;
    }

    if (savedContractTradeId === null) {
      setError("Create the onchain escrow trade first.");
      return;
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC on Arc Testnet.");
      return;
    }

    if (!hasEnoughAllowance) {
      setError("Approve USDC first before funding escrow.");
      return;
    }

    prepareAction("fund");

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "fundTrade",
      args: [BigInt(savedContractTradeId)],
    });
  }

  function handleMarkShipped() {
    if (!isConnected || !address) {
      setError("Connect the seller wallet before marking shipment.");
      return;
    }

    if (!isSeller) {
      setError("Only the seller wallet can mark this trade as shipped.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before marking shipment.");
      return;
    }

    if (savedContractTradeId === null) {
      setError("Onchain escrow must exist before shipping.");
      return;
    }

    prepareAction("ship");

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "markShipped",
      args: [BigInt(savedContractTradeId)],
    });
  }

  function handleConfirmReceived() {
    if (!isConnected || !address) {
      setError("Connect the buyer wallet before confirming receipt.");
      return;
    }

    if (!isBuyer) {
      setError("Only the buyer wallet can confirm this trade.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before confirming receipt.");
      return;
    }

    if (savedContractTradeId === null) {
      setError("Onchain escrow must exist before confirming receipt.");
      return;
    }

    prepareAction("complete");

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "confirmReceived",
      args: [BigInt(savedContractTradeId)],
    });
  }

  function handleOpenDispute() {
    if (!isConnected || !address) {
      setError("Connect the wallet that is opening the dispute.");
      return;
    }

    if (!isBuyer && !isSeller) {
      setError("Only the buyer or seller can open a dispute.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before opening a dispute.");
      return;
    }

    if (savedContractTradeId === null) {
      setError("Onchain escrow must exist before opening a dispute.");
      return;
    }

    if (!disputeReason.trim()) {
      setError("A dispute reason is required.");
      return;
    }

    prepareAction("dispute");

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "openDispute",
      args: [BigInt(savedContractTradeId)],
    });
  }

  const isBusy = isWriting || isConfirming;
  const onchainActionsDisabled = isBusy || !isOnArc;

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Trade actions on Arc</CardTitle>
          <CardDescription>
            Local trade record <span className="font-medium">{trade.id}</span> · Buyer{" "}
            {shortenAddress(trade.buyerAddress)} · Seller{" "}
            {shortenAddress(trade.sellerAddress)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && !isOnArc ? (
            <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-900">
                Wrong network detected. Switch to Arc Testnet to use onchain escrow
                actions.
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Onchain contract tradeId</p>
              <p className="mt-1 text-lg font-semibold">
                {savedContractTradeId ?? "Not created yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Current local status</p>
              <p className="mt-1 text-lg font-semibold">{savedStatus}</p>
            </div>
          </div>

          {hasOnchainTrade ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Onchain escrow state</p>
                  <p className="mt-1 text-lg font-semibold">
                    {onchainStatusValue !== null
                      ? onchainStatusLabels[onchainStatusValue] ?? `Unknown (${onchainStatusValue})`
                      : "Loading from Arc..."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSyncFromChain}
                  disabled={isSyncingFromChain || localStatusFromChain === null}
                  className="rounded-full"
                >
                  {isSyncingFromChain ? "Syncing..." : "Sync from Chain"}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Onchain buyer</p>
                  <p className="mt-1 font-medium">
                    {onchainTrade ? shortenAddress(onchainTrade.buyer) : "Loading..."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Onchain seller</p>
                  <p className="mt-1 font-medium">
                    {onchainTrade ? shortenAddress(onchainTrade.seller) : "Loading..."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Onchain amount</p>
                  <p className="mt-1 font-medium">
                    {onchainTrade ? `${formatUsdc(onchainTrade.amount)} USDC` : "Loading..."}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Local amount</p>
                  <p className="mt-1 font-medium">{trade.amount} USDC</p>
                </div>
              </div>

              {localStatusOutOfSync ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                  Local status is out of sync with onchain status.
                </div>
              ) : null}

              {hasCriticalMismatch ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Local buyer, seller, or amount does not match the onchain escrow
                  record. Do not overwrite critical fields automatically.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Buyer USDC balance on Arc</p>
              <p className="mt-1 text-lg font-semibold">
                {balance !== undefined ? `${formatUsdc(balance)} USDC` : "Connect on Arc"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Allowance to escrow</p>
              <p className="mt-1 text-lg font-semibold">
                {allowance !== undefined ? `${formatUsdc(allowance)} USDC` : "Not available"}
              </p>
            </div>
          </div>

          {!hasOnchainTrade ? (
            <Button
              type="button"
              onClick={handleCreateOnchainEscrow}
              disabled={onchainActionsDisabled}
              className="w-full rounded-full"
            >
              {currentAction === "create" && isBusy
                ? isWriting
                  ? "Confirm in wallet..."
                  : "Waiting for receipt..."
                : "Create Onchain Escrow"}
            </Button>
          ) : null}

          {hasOnchainTrade && savedStatus === "CREATED" && isBuyer ? (
            <div className="space-y-3">
              {!hasEnoughBalance ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                  Insufficient USDC on Arc Testnet. Get testnet USDC from the Circle
                  faucet:{" "}
                  <a
                    href={faucetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    faucet.circle.com
                  </a>
                </div>
              ) : null}

              {!hasEnoughAllowance ? (
                <Button
                  type="button"
                  onClick={handleApproveUsdc}
                  disabled={onchainActionsDisabled || !hasEnoughBalance}
                  className="w-full rounded-full"
                >
                  {currentAction === "approve" && isBusy
                    ? isWriting
                      ? "Confirm approve in wallet..."
                      : "Waiting for approve receipt..."
                    : "Approve USDC"}
                </Button>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                  Allowance is already high enough. You can fund escrow directly.
                </div>
              )}

              <Button
                type="button"
                onClick={handleFundEscrow}
                disabled={
                  onchainActionsDisabled || !hasEnoughBalance || !hasEnoughAllowance
                }
                className="w-full rounded-full"
              >
                {currentAction === "fund" && isBusy
                  ? isWriting
                    ? "Confirm fund in wallet..."
                    : "Waiting for fund receipt..."
                  : "Fund Escrow"}
              </Button>
            </div>
          ) : null}

          {savedStatus === "FUNDED" && isSeller ? (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4">
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
                disabled={onchainActionsDisabled}
                className="w-full rounded-full"
              >
                {currentAction === "ship" && isBusy
                  ? isWriting
                    ? "Confirm shipment in wallet..."
                    : "Waiting for shipped receipt..."
                  : "Mark as Shipped"}
              </Button>
            </div>
          ) : null}

          {savedStatus === "SHIPPED" && isBuyer ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                This will release escrowed USDC to the seller. Only confirm after
                receiving the item.
              </div>
              <Button
                type="button"
                onClick={handleConfirmReceived}
                disabled={onchainActionsDisabled}
                className="w-full rounded-full"
              >
                {currentAction === "complete" && isBusy
                  ? isWriting
                    ? "Confirm release in wallet..."
                    : "Waiting for completion receipt..."
                  : "Confirm Received & Release USDC"}
              </Button>
            </div>
          ) : null}

          {canOpenDispute ? (
            <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dispute reason</label>
                <Textarea
                  value={disputeReason}
                  onChange={(event) => setDisputeReason(event.target.value)}
                  placeholder="Describe what went wrong with the trade."
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleOpenDispute}
                disabled={onchainActionsDisabled || !disputeReason.trim()}
                className="w-full rounded-full"
              >
                {currentAction === "dispute" && isBusy
                  ? isWriting
                    ? "Confirm dispute in wallet..."
                    : "Waiting for dispute receipt..."
                  : "Open Dispute"}
              </Button>
            </div>
          ) : null}

          {savedDisputeReason ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Saved dispute reason</p>
              <p className="mt-1 text-sm leading-6">{savedDisputeReason}</p>
            </div>
          ) : null}

          {savedCreateTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Create tx</p>
              <a
                href={getArcTxUrl(savedCreateTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedCreateTxHash}
              </a>
            </div>
          ) : null}

          {savedFundTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Fund tx</p>
              <a
                href={getArcTxUrl(savedFundTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedFundTxHash}
              </a>
            </div>
          ) : null}

          {savedShippedTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Shipped tx</p>
              <a
                href={getArcTxUrl(savedShippedTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedShippedTxHash}
              </a>
            </div>
          ) : null}

          {savedCompletedTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Completed tx</p>
              <a
                href={getArcTxUrl(savedCompletedTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedCompletedTxHash}
              </a>
            </div>
          ) : null}

          {savedDisputeTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Dispute tx</p>
              <a
                href={getArcTxUrl(savedDisputeTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedDisputeTxHash}
              </a>
            </div>
          ) : null}

          {savedResolveTxHash ? (
            <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Resolve tx</p>
              <a
                href={getArcTxUrl(savedResolveTxHash as Hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {savedResolveTxHash}
              </a>
            </div>
          ) : null}

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
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Trade timeline</CardTitle>
          <CardDescription>
            Created locally → Created onchain → Funded → Shipped → Completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeTimeline
            trade={{
              ...trade,
              status: savedStatus,
              contractTradeId: savedContractTradeId,
              createTxHash: savedCreateTxHash,
              fundTxHash: savedFundTxHash,
              shippedTxHash: savedShippedTxHash,
              completedTxHash: savedCompletedTxHash,
              disputeTxHash: savedDisputeTxHash,
              resolveTxHash: savedResolveTxHash,
              trackingNumber,
              disputeReason: savedDisputeReason,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
