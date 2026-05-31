"use client";

import { useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { ARC_TESTNET_CHAIN_ID, shortenAddress } from "@/lib/arc";
import { Button } from "@/components/ui/button";

export function ConnectWalletButton() {
  const { address, chainId, isConnected, status } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isReconnecting = status === "reconnecting";
  const isConnecting = status === "connecting" || isPending;

  const injectedConnector = useMemo(
    () => connectors.find((connector) => connector.type === "injected"),
    [connectors],
  );

  if (isReconnecting) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" className="rounded-full px-5" disabled>
          Reconnecting...
        </Button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          className="rounded-full px-5"
          disabled={!injectedConnector || isConnecting}
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
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
        {error ? (
          <p className="max-w-52 text-right text-xs text-destructive">
            {error.message}
          </p>
        ) : null}
      </div>
    );
  }

  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="rounded-full px-5"
          onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
          disabled={isSwitchingChain}
        >
          {isSwitchingChain ? "Switching..." : "Switch to Arc Testnet"}
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

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" className="rounded-full px-5">
        {shortenAddress(address)}
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
