import { createConfig, createStorage, http, injected, noopStorage } from "wagmi";

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
  storage: createStorage({
    storage:
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : noopStorage,
  }),
  ssr: true,
  syncConnectedChain: true,
});
