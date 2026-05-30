"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectWalletButton() {
  return (
    <ConnectButton
      accountStatus="address"
      chainStatus="name"
      showBalance={false}
    />
  );
}
