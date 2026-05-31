"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Address, type Hash } from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  formatUsdc,
  getArcTxUrl,
  shortenAddress,
} from "@/lib/arc";
import {
  type DisputeResolutionSuggestion,
  type DisputeSummaryResponse,
} from "@/lib/dispute-agent";
import { Trade, TradeWithListing, formatPriceLabel } from "@/lib/marketplace";

type ResolveAction = {
  localTradeId: string;
  contractTradeId: number;
  releaseToSeller: boolean;
} | null;

type ResolutionResult = {
  hash: Hash;
  localTradeId: string;
  onchainStatus: Trade["status"];
};

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

const onchainStatusLabels = [
  "Created",
  "Funded",
  "Shipped",
  "Completed",
  "Cancelled",
  "Disputed",
  "Refunded",
] as const;

export function AdminDisputesPanel({
  disputes,
}: {
  disputes: TradeWithListing[];
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID });
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<ResolveAction>(null);
  const [agentLoadingTradeId, setAgentLoadingTradeId] = useState<string | null>(null);
  const [agentResults, setAgentResults] = useState<
    Record<string, DisputeSummaryResponse>
  >({});
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResult | null>(
    null,
  );

  const isOnArc = chainId === ARC_TESTNET_CHAIN_ID;
  const normalizedAdminAddress = ARC_ADMIN_ADDRESS.toLowerCase();
  const normalizedConnectedAddress = address?.toLowerCase();
  const isAdmin = normalizedConnectedAddress === normalizedAdminAddress;
  const adminConfigured =
    ARC_ADMIN_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const escrowAddressConfigured =
    ARC_ESCROW_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const {
    isPending: isWriting,
    error: writeError,
    writeContractAsync,
  } = useWriteContract();

  async function handleResolve(trade: TradeWithListing, releaseToSeller: boolean) {
    if (!isConnected || !address) {
      setError("Connect the configured admin wallet before resolving disputes.");
      return;
    }

    if (!adminConfigured) {
      setError("NEXT_PUBLIC_ADMIN_ADDRESS is not configured.");
      return;
    }

    if (!escrowAddressConfigured) {
      setError("NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS is not configured.");
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

    if (!publicClient) {
      setError("Arc Testnet public client is not ready yet.");
      return;
    }

    if (trade.contractTradeId === null) {
      setError("This dispute does not have an onchain trade ID.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setResolutionResult(null);
    setResolveAction({
      localTradeId: trade.id,
      contractTradeId: trade.contractTradeId,
      releaseToSeller,
    });

    try {
      const hash = await writeContractAsync({
        address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
        abi: arcSafeTradeEscrowAbi,
        functionName: "resolveDispute",
        args: [BigInt(trade.contractTradeId), releaseToSeller],
      });

      setIsWaitingForReceipt(true);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== "success") {
        throw new Error("Arc transaction was not confirmed successfully.");
      }

      const onchainTrade = await publicClient.readContract({
        address: ARC_ESCROW_CONTRACT_ADDRESS as Address,
        abi: arcSafeTradeEscrowAbi,
        functionName: "getTrade",
        args: [BigInt(trade.contractTradeId)],
      });

      const onchainStatus = Number(onchainTrade.status);
      const expectedStatus = releaseToSeller ? 3 : 6;

      if (onchainStatus !== expectedStatus) {
        throw new Error(
          `Onchain dispute resolved to ${onchainStatusLabels[onchainStatus] ?? `Unknown (${onchainStatus})`} instead of ${releaseToSeller ? "Completed" : "Refunded"}.`,
        );
      }

      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: mapOnchainStatusToLocal(onchainStatus),
          resolveTxHash: hash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save dispute resolution");
      }

      setResolutionResult({
        hash,
        localTradeId: trade.id,
        onchainStatus: mapOnchainStatusToLocal(onchainStatus),
      });
      setSuccessMessage(
        releaseToSeller
          ? "Dispute resolved on Arc. Seller release confirmed and local state synced."
          : "Dispute resolved on Arc. Buyer refund confirmed and local state synced.",
      );
      setResolveAction(null);
      router.refresh();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Unexpected error while resolving the dispute",
      );
    } finally {
      setIsWaitingForReceipt(false);
    }
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

  const displayError = error || writeError?.message || null;
  const isBusy = isWriting || isWaitingForReceipt;

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
          {!escrowAddressConfigured ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              Set <code>NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS</code> to enable
              onchain dispute settlement.
            </div>
          ) : null}
          {isConnected && !isOnArc ? (
            <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-900">
                Connected wallet is not on Arc Testnet. Switch networks before
                resolving disputes.
              </p>
              <Button
                type="button"
                onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                disabled={isSwitchingChain}
                className="rounded-full"
              >
                {isSwitchingChain ? "Switching..." : "Switch to Arc Testnet"}
              </Button>
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {resolutionResult ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              <p>
                Onchain status after resolution:{" "}
                <span className="font-medium">{resolutionResult.onchainStatus}</span>
              </p>
              <a
                href={getArcTxUrl(resolutionResult.hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline"
              >
                View resolution tx on ArcScan
              </a>
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
          <DisputeTradeCard
            key={trade.id}
            trade={trade}
            isResolvingThisTrade={isResolvingThisTrade}
            isBusy={isBusy}
            isWaitingForReceipt={isWaitingForReceipt}
            isWriting={isWriting}
            isAdmin={isAdmin}
            adminConfigured={adminConfigured}
            escrowAddressConfigured={escrowAddressConfigured}
            isOnArc={isOnArc}
            isLoadingAgent={isLoadingAgent}
            agentError={agentError}
            agentResult={agentResult}
            onAskAgent={handleAskAgent}
            onResolve={handleResolve}
          />
        );
      })}
    </div>
  );
}

function DisputeTradeCard({
  trade,
  isResolvingThisTrade,
  isBusy,
  isWaitingForReceipt,
  isWriting,
  isAdmin,
  adminConfigured,
  escrowAddressConfigured,
  isOnArc,
  isLoadingAgent,
  agentError,
  agentResult,
  onAskAgent,
  onResolve,
}: {
  trade: TradeWithListing;
  isResolvingThisTrade: boolean;
  isBusy: boolean;
  isWaitingForReceipt: boolean;
  isWriting: boolean;
  isAdmin: boolean;
  adminConfigured: boolean;
  escrowAddressConfigured: boolean;
  isOnArc: boolean;
  isLoadingAgent: boolean;
  agentError?: string;
  agentResult?: DisputeSummaryResponse;
  onAskAgent: (tradeId: string) => void;
  onResolve: (trade: TradeWithListing, releaseToSeller: boolean) => void;
}) {
  const { data: onchainTrade, error: onchainError } = useReadContract({
    address:
      escrowAddressConfigured && trade.contractTradeId !== null
        ? (ARC_ESCROW_CONTRACT_ADDRESS as Address)
        : undefined,
    abi: arcSafeTradeEscrowAbi,
    functionName: "getTrade",
    args: trade.contractTradeId !== null ? [BigInt(trade.contractTradeId)] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: {
      enabled: escrowAddressConfigured && trade.contractTradeId !== null,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  });

  const onchainStatusValue =
    onchainTrade !== undefined ? Number(onchainTrade.status) : null;
  const onchainStatusLabel =
    onchainStatusValue !== null
      ? onchainStatusLabels[onchainStatusValue] ?? `Unknown (${onchainStatusValue})`
      : trade.contractTradeId === null
        ? "Missing trade ID"
        : "Loading...";

  return (
    <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="Contract tradeId" value={String(trade.contractTradeId ?? "Missing")} />
          <InfoTile label="Local status" value={trade.status} />
          <InfoTile label="Onchain status" value={onchainStatusLabel} />
          <InfoTile label="Amount" value={formatPriceLabel(trade.amount)} />
          <InfoTile label="Buyer" value={shortenAddress(trade.buyerAddress)} />
          <InfoTile label="Seller" value={shortenAddress(trade.sellerAddress)} />
        </div>

        {onchainError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to read onchain trade state: {onchainError.message}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile
            label="Tracking number"
            value={trade.trackingNumber || "Not provided"}
          />
          <InfoTile
            label="Onchain buyer"
            value={onchainTrade ? shortenAddress(onchainTrade.buyer) : "Loading..."}
          />
          <InfoTile
            label="Onchain seller"
            value={onchainTrade ? shortenAddress(onchainTrade.seller) : "Loading..."}
          />
        </div>

        {onchainTrade ? (
          <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">Onchain amount</p>
            <p className="mt-1 font-medium">{formatUsdc(onchainTrade.amount)} USDC</p>
          </div>
        ) : null}

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
            onClick={() => onAskAgent(trade.id)}
            disabled={isLoadingAgent}
            className="rounded-full"
          >
            {isLoadingAgent ? "Analyzing dispute..." : "Ask Agent"}
          </Button>
          <Button
            type="button"
            onClick={() => onResolve(trade, true)}
            disabled={
              isBusy ||
              !isAdmin ||
              !adminConfigured ||
              !escrowAddressConfigured ||
              !isOnArc ||
              trade.contractTradeId === null
            }
            className="rounded-full"
          >
            {isResolvingThisTrade && isBusy
              ? isWriting
                ? "Confirm seller release..."
                : isWaitingForReceipt
                  ? "Waiting for receipt..."
                  : "Resolving..."
              : "Release to Seller"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onResolve(trade, false)}
            disabled={
              isBusy ||
              !isAdmin ||
              !adminConfigured ||
              !escrowAddressConfigured ||
              !isOnArc ||
              trade.contractTradeId === null
            }
            className="rounded-full"
          >
            {isResolvingThisTrade && isBusy
              ? isWriting
                ? "Confirm buyer refund..."
                : isWaitingForReceipt
                  ? "Waiting for receipt..."
                  : "Resolving..."
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
                  <CardTitle className="text-lg">Agent recommendation</CardTitle>
                  <CardDescription>
                    Agent recommendation is advisory only. Admin must execute the
                    final onchain resolution.
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
                <p className="mt-1 text-sm leading-6">{agentResult.reasoning}</p>
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
      <p className="mt-1 font-medium break-all">{value}</p>
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
