"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type Address, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { arcSafeTradeEscrowAbi } from "@/lib/arc-safe-trade-escrow-abi";
import {
  ARC_ADMIN_ADDRESS,
  ARC_ESCROW_CONTRACT_ADDRESS,
  ARC_TESTNET_CHAIN_ID,
  getArcTxUrl,
  shortenAddress,
} from "@/lib/arc";
import {
  type DisputeSummaryResponse,
  type DisputeResolutionSuggestion,
} from "@/lib/dispute-agent";
import { TradeWithListing, formatPriceLabel } from "@/lib/marketplace";

type ResolveAction = {
  localTradeId: string;
  releaseToSeller: boolean;
} | null;

export function AdminDisputesPanel({
  disputes,
}: {
  disputes: TradeWithListing[];
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<ResolveAction>(null);
  const [agentLoadingTradeId, setAgentLoadingTradeId] = useState<string | null>(null);
  const [agentResults, setAgentResults] = useState<
    Record<string, DisputeSummaryResponse>
  >({});
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});
  const hasPatchedRef = useRef(false);

  const isOnArc = chainId === ARC_TESTNET_CHAIN_ID;
  const normalizedAdminAddress = ARC_ADMIN_ADDRESS.toLowerCase();
  const normalizedConnectedAddress = address?.toLowerCase();
  const isAdmin = normalizedConnectedAddress === normalizedAdminAddress;
  const adminConfigured =
    ARC_ADMIN_ADDRESS !== "0x0000000000000000000000000000000000000000";

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
    async function persistResolution() {
      if (!receipt || !txHash || !resolveAction || hasPatchedRef.current) {
        return;
      }

      hasPatchedRef.current = true;

      try {
        const response = await fetch(`/api/trades/${resolveAction.localTradeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: resolveAction.releaseToSeller ? "COMPLETED" : "REFUNDED",
            resolveTxHash: txHash,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save dispute resolution");
        }

        setSuccessMessage(
          resolveAction.releaseToSeller
            ? "Dispute resolved. Funds released to seller on Arc."
            : "Dispute resolved. Buyer refund recorded on Arc.",
        );
        setError(null);
        setResolveAction(null);
        router.refresh();
      } catch (persistError) {
        hasPatchedRef.current = false;
        setError(
          persistError instanceof Error
            ? persistError.message
            : "Unexpected error while saving dispute resolution",
        );
      }
    }

    void persistResolution();
  }, [receipt, resolveAction, router, txHash]);

  function handleResolve(trade: TradeWithListing, releaseToSeller: boolean) {
    if (!isConnected || !address) {
      setError("Connect the configured admin wallet before resolving disputes.");
      return;
    }

    if (!adminConfigured) {
      setError("NEXT_PUBLIC_ADMIN_ADDRESS is not configured.");
      return;
    }

    if (!isAdmin) {
      setError("Only the configured admin wallet can resolve disputes.");
      return;
    }

    if (!isOnArc) {
      setError("Switch to Arc Testnet before resolving disputes.");
      return;
    }

    if (trade.contractTradeId === null) {
      setError("This dispute does not have an onchain trade ID.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    hasPatchedRef.current = false;
    setResolveAction({
      localTradeId: trade.id,
      releaseToSeller,
    });

    writeContract({
      address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
      abi: arcSafeTradeEscrowAbi,
      functionName: "resolveDispute",
      args: [BigInt(trade.contractTradeId), releaseToSeller],
    });
  }

  async function handleAskAgent(tradeId: string) {
    setAgentLoadingTradeId(tradeId);
    setAgentErrors((current) => {
      const next = { ...current };
      delete next[tradeId];
      return next;
    });

    try {
      const response = await fetch("/api/agent/dispute-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tradeId }),
      });

      const data = (await response.json()) as
        | DisputeSummaryResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to fetch agent recommendation",
        );
      }

      setAgentResults((current) => ({
        ...current,
        [tradeId]: data as DisputeSummaryResponse,
      }));
    } catch (agentError) {
      setAgentErrors((current) => ({
        ...current,
        [tradeId]:
          agentError instanceof Error
            ? agentError.message
            : "Unexpected error while asking the agent",
      }));
    } finally {
      setAgentLoadingTradeId(null);
    }
  }

  const displayError = error || writeError?.message || receiptError?.message || null;
  const isBusy = isWriting || isConfirming;

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Admin arbitration</CardTitle>
          <CardDescription>
            Admin arbitration is centralized in MVP. Future version will add
            agent-assisted dispute analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Badge className="rounded-full">Admin wallet</Badge>
            <Badge variant="outline" className="rounded-full">
              {shortenAddress(ARC_ADMIN_ADDRESS)}
            </Badge>
            <Badge variant={isAdmin ? "default" : "secondary"} className="rounded-full">
              {isAdmin ? "Admin connected" : "Viewer mode"}
            </Badge>
          </div>
          {!adminConfigured ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              Set <code>NEXT_PUBLIC_ADMIN_ADDRESS</code> to enable dispute
              resolution.
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

      {disputes.length === 0 ? (
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
          <CardContent className="py-10 text-center text-muted-foreground">
            No disputed trades are waiting for review.
          </CardContent>
        </Card>
      ) : null}

      {disputes.map((trade) => {
        const isResolvingThisTrade = resolveAction?.localTradeId === trade.id;
        const agentResult = agentResults[trade.id];
        const agentError = agentErrors[trade.id];
        const isLoadingAgent = agentLoadingTradeId === trade.id;

        return (
          <Card
            key={trade.id}
            className="rounded-[1.75rem] border border-border/70 bg-card/85"
          >
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle>{trade.listing.title}</CardTitle>
                  <CardDescription>
                    Local trade {trade.id.slice(0, 8)} · Onchain trade{" "}
                    {trade.contractTradeId ?? "missing"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {trade.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile label="Amount" value={formatPriceLabel(trade.amount)} />
                <InfoTile label="Buyer" value={shortenAddress(trade.buyerAddress)} />
                <InfoTile label="Seller" value={shortenAddress(trade.sellerAddress)} />
                <InfoTile
                  label="Tracking number"
                  value={trade.trackingNumber || "Not provided"}
                />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">Dispute reason</p>
                <p className="mt-1 text-sm leading-6">
                  {trade.disputeReason || "No reason saved"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <TxLink label="Create tx" hash={trade.createTxHash} />
                <TxLink label="Fund tx" hash={trade.fundTxHash} />
                <TxLink label="Shipped tx" hash={trade.shippedTxHash} />
                <TxLink label="Dispute tx" hash={trade.disputeTxHash} />
                <TxLink label="Resolve tx" hash={trade.resolveTxHash} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAskAgent(trade.id)}
                  disabled={isLoadingAgent}
                  className="rounded-full"
                >
                  {isLoadingAgent ? "Analyzing dispute..." : "Ask Agent"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleResolve(trade, true)}
                  disabled={isBusy || !isAdmin || !adminConfigured}
                  className="rounded-full"
                >
                  {isResolvingThisTrade && resolveAction?.releaseToSeller && isBusy
                    ? isWriting
                      ? "Confirm seller release..."
                      : "Waiting for receipt..."
                    : "Release to Seller"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleResolve(trade, false)}
                  disabled={isBusy || !isAdmin || !adminConfigured}
                  className="rounded-full"
                >
                  {isResolvingThisTrade && !resolveAction?.releaseToSeller && isBusy
                    ? isWriting
                      ? "Confirm buyer refund..."
                      : "Waiting for receipt..."
                    : "Refund Buyer"}
                </Button>
              </div>

              {agentError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {agentError}
                </div>
              ) : null}

              {agentResult ? (
                <Card className="rounded-[1.5rem] border border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">
                          Agent recommendation
                        </CardTitle>
                        <CardDescription>
                          Agent recommendation is advisory only. Admin must execute
                          the final onchain resolution.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full">
                          {formatSuggestion(agentResult.suggestedResolution)}
                        </Badge>
                        <Badge variant="outline" className="rounded-full">
                          {agentResult.isMocked
                            ? `Mocked ${agentResult.provider}`
                            : agentResult.provider}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Summary</p>
                      <p className="mt-1 text-sm leading-6">{agentResult.summary}</p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Reasoning</p>
                      <p className="mt-1 text-sm leading-6">
                        {agentResult.reasoning}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Risk flags</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {agentResult.riskFlags.length > 0 ? (
                          agentResult.riskFlags.map((flag) => (
                            <Badge
                              key={flag}
                              variant="outline"
                              className="rounded-full border-amber-500/30 bg-amber-500/10 text-amber-900"
                            >
                              {flag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No major risk flags identified from stored data.
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatSuggestion(suggestion: DisputeResolutionSuggestion) {
  switch (suggestion) {
    case "RELEASE_TO_SELLER":
      return "Release to Seller";
    case "REFUND_BUYER":
      return "Refund Buyer";
    case "NEED_MORE_INFO":
      return "Need More Info";
    default:
      return suggestion;
  }
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function TxLink({
  label,
  hash,
}: {
  label: string;
  hash: string | null;
}) {
  if (!hash) {
    return null;
  }

  return (
    <a
      href={getArcTxUrl(hash as Hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-full border border-border/60 px-3 py-1.5 font-medium text-primary underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}
