import { createConfig, http, injected } from "wagmi";

import { ARC_TESTNET_RPC_URL, arcTestnet } from "@/lib/arc";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_RPC_URL),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
  syncConnectedChain: true,
});
