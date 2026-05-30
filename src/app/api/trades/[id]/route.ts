import { ListingStatus, TradeStatus } from "@prisma/client";

import { getDb } from "@/lib/db";
import { errorResponse, handleRouteError, json } from "@/lib/api";
import { updateTradeSchema } from "@/lib/validators";

function getListingStatusForTrade(status: TradeStatus) {
  switch (status) {
    case TradeStatus.COMPLETED:
      return ListingStatus.SOLD;
    case TradeStatus.CANCELLED:
    case TradeStatus.REFUNDED:
      return ListingStatus.ACTIVE;
    default:
      return ListingStatus.RESERVED;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const trade = await db.trade.findUnique({
      where: { id },
      include: { listing: true },
    });

    if (!trade) {
      return errorResponse("Trade not found", 404);
    }

    return json(trade);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTradeSchema.parse(body);
    const db = getDb();

    const existingTrade = await db.trade.findUnique({
      where: { id },
    });

    if (!existingTrade) {
      return errorResponse("Trade not found", 404);
    }

    const updatedTrade = await db.$transaction(async (tx) => {
      const trade = await tx.trade.update({
        where: { id },
        data: {
          status: parsed.status,
          contractTradeId: parsed.contractTradeId,
          createTxHash: parsed.createTxHash,
          fundTxHash: parsed.fundTxHash,
          shippedTxHash: parsed.shippedTxHash,
          completedTxHash: parsed.completedTxHash,
          disputeTxHash: parsed.disputeTxHash,
          resolveTxHash: parsed.resolveTxHash,
          trackingNumber: parsed.trackingNumber,
          disputeReason: parsed.disputeReason,
        },
      });

      if (parsed.status) {
        await tx.listing.update({
          where: { id: trade.listingId },
          data: {
            status: getListingStatusForTrade(parsed.status),
          },
        });
      }

      return trade;
    });

    return json(updatedTrade);
  } catch (error) {
    return handleRouteError(error);
  }
}
