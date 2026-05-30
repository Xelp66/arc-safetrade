"use client";

import { AlertTriangle, CheckCircle2, Coins, Globe } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

import {
  ARC_TESTNET_CHAIN_ID,
  shortenAddress,
} from "@/lib/arc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/65 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function NetworkStatusCard() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isOnArcTestnet = chainId === ARC_TESTNET_CHAIN_ID;

  return (
    <Card className="border-border/70 bg-linear-to-b from-secondary via-background to-card shadow-none">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Network status
            </CardTitle>
            <CardDescription>
              Simple connection info for testing Arc wallet flows.
            </CardDescription>
          </div>
          <Badge
            variant={isOnArcTestnet ? "default" : "outline"}
            className="rounded-full"
          >
            {isOnArcTestnet ? "On Arc Testnet" : "Wrong network"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <StatusRow
          label="Wallet"
          value={isConnected ? shortenAddress(address) : "Not connected"}
        />
        <StatusRow
          label="Current chain"
          value={chain?.name ?? "No chain selected"}
        />
        <StatusRow
          label="Arc Testnet"
          value={isOnArcTestnet ? "Yes" : "No"}
        />

        <div className="rounded-2xl border border-border/60 bg-background/65 p-4">
          <div className="flex items-start gap-3">
            <Coins className="mt-0.5 size-5 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">USDC gas info</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Arc uses USDC as gas. Keep a small USDC balance in the connected
                wallet so transactions and network switches can complete.
              </p>
            </div>
          </div>
        </div>

        {isConnected && !isOnArcTestnet ? (
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Switch required</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Your wallet is connected, but not to Arc Testnet. Switch
                  networks before interacting with escrow actions.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
              disabled={isPending}
              className="w-full rounded-full"
            >
              {isPending ? "Switching..." : "Switch to Arc Testnet"}
            </Button>
          </div>
        ) : null}

        {isConnected && isOnArcTestnet ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium">Ready for Arc testing</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Wallet connected and pointed at Arc Testnet.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
