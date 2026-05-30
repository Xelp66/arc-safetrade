"use client";

import "@rainbow-me/rainbowkit/styles.css";

import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "@/lib/wagmi";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          coolMode
          modalSize="compact"
          theme={{
            lightMode: lightTheme({
              accentColor: "#0f766e",
              accentColorForeground: "#f7f7f2",
              borderRadius: "large",
            }),
            darkMode: darkTheme({
              accentColor: "#1d4ed8",
              accentColorForeground: "#f8fafc",
              borderRadius: "large",
            }),
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
