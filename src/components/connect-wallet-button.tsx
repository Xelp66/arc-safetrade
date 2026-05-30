"use client";

import { useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { ARC_TESTNET_CHAIN_ID, shortenAddress } from "@/lib/arc";
import { Button } from "@/components/ui/button";

export function ConnectWalletButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = useMemo(
    () => connectors.find((connector) => connector.type === "injected"),
    [connectors],
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          className="rounded-full px-5"
          disabled={!injectedConnector || isPending}
          onClick={() => {
            if (!injectedConnector) {
              return;
            }

            connect({
              connector: injectedConnector,
              chainId: ARC_TESTNET_CHAIN_ID,
            });
          }}
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
        {error ? (
          <p className="max-w-52 text-right text-xs text-destructive">
            {error.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={chainId === ARC_TESTNET_CHAIN_ID ? "outline" : "default"}
        className="rounded-full px-5"
      >
        {chainId === ARC_TESTNET_CHAIN_ID
          ? shortenAddress(address)
          : "Wrong Network"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="rounded-full px-4"
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
    </div>
  );
}
