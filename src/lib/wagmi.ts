import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

import { ARC_TESTNET_RPC_URL, arcTestnet } from "@/lib/arc";

export const wagmiConfig = getDefaultConfig({
  appName: "Arc SafeTrade",
  appDescription: "Escrow marketplace for second-hand trades on Arc Network.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "demo-walletconnect-project-id",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_RPC_URL),
  },
  ssr: true,
});
