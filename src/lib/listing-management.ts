import { Listing, Trade } from "@/lib/marketplace";

const editBlockingTradeStatuses: Trade["status"][] = [
  "CREATED",
  "FUNDED",
  "SHIPPED",
  "DISPUTED",
  "COMPLETED",
  "REFUNDED",
];

const cancelBlockingTradeStatuses: Trade["status"][] = [
  "CREATED",
  "FUNDED",
  "SHIPPED",
  "DISPUTED",
  "COMPLETED",
  "REFUNDED",
];

function hasTradeWithStatus(
  trades: Pick<Trade, "status">[],
  blockedStatuses: Trade["status"][],
) {
  return trades.some((trade) => blockedStatuses.includes(trade.status));
}

export function canEditListing(
  listing: Pick<Listing, "status">,
  trades: Pick<Trade, "status">[],
) {
  return (
    listing.status === "ACTIVE" &&
    !hasTradeWithStatus(trades, editBlockingTradeStatuses)
  );
}

export function canCancelListing(
  listing: Pick<Listing, "status">,
  trades: Pick<Trade, "status">[],
) {
  return (
    listing.status === "ACTIVE" &&
    !hasTradeWithStatus(trades, cancelBlockingTradeStatuses)
  );
}

export function getEditListingBlockReason(
  listing: Pick<Listing, "status">,
  trades: Pick<Trade, "status">[],
) {
  if (listing.status !== "ACTIVE") {
    return "Only ACTIVE listings can be edited.";
  }

  if (hasTradeWithStatus(trades, editBlockingTradeStatuses)) {
    return "Listing editing is blocked once a SafeTrade has started.";
  }

  return null;
}

export function getCancelListingBlockReason(
  listing: Pick<Listing, "status">,
  trades: Pick<Trade, "status">[],
) {
  if (listing.status === "SOLD") {
    return "Sold listings cannot be cancelled.";
  }

  if (listing.status !== "ACTIVE") {
    return "Only ACTIVE listings can be cancelled.";
  }

  if (hasTradeWithStatus(trades, cancelBlockingTradeStatuses)) {
    return "Listings with active or historical SafeTrade records cannot be cancelled for MVP.";
  }

  return null;
}
