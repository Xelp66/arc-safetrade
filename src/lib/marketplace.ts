export type Listing = {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string | null;
  category: string | null;
  city: string | null;
  sellerAddress: string;
  status: "ACTIVE" | "RESERVED" | "SOLD" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

export type Trade = {
  id: string;
  listingId: string;
  contractTradeId: number | null;
  buyerAddress: string;
  sellerAddress: string;
  amount: string;
  status:
    | "CREATED"
    | "FUNDED"
    | "SHIPPED"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED"
    | "REFUNDED";
  createTxHash: string | null;
  fundTxHash: string | null;
  shippedTxHash: string | null;
  completedTxHash: string | null;
  disputeTxHash: string | null;
  resolveTxHash: string | null;
  trackingNumber: string | null;
  disputeReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TradeWithListing = Trade & { listing: Listing };

export function formatPriceLabel(price: string) {
  const numericValue = Number(price);

  if (Number.isNaN(numericValue)) {
    return `${price} USDC`;
  }

  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} USDC`;
}
