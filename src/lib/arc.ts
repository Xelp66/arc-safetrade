import { defineChain, formatUnits, parseUnits } from "viem";

export const ARC_TESTNET_CHAIN_ID = 5_042_002;
export const ARC_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network";
export const ARC_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app";
export const ARC_USDC_ADDRESS =
  process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ||
  "0x3600000000000000000000000000000000000000";
export const ARC_ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
export const ARC_ADMIN_ADDRESS =
  process.env.NEXT_PUBLIC_ADMIN_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
export const USDC_DECIMALS = 6;

export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_TESTNET_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_EXPLORER_URL,
    },
  },
  testnet: true,
});

export function shortenAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getArcTxUrl(txHash: string) {
  return `${ARC_EXPLORER_URL}/tx/${txHash}`;
}

export function parseUsdc(amount: string) {
  return parseUnits(amount, USDC_DECIMALS);
}

export function formatUsdc(amount: bigint) {
  return formatUnits(amount, USDC_DECIMALS);
}
