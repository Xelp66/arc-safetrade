import { TradeStatus } from "@prisma/client";

import { errorResponse, handleRouteError, json } from "@/lib/api";
import { getDb } from "@/lib/db";
import { generateDisputeSummary } from "@/lib/dispute-agent";
import { TradeWithListing } from "@/lib/marketplace";
import { disputeSummarySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId } = disputeSummarySchema.parse(body);
    const db = getDb();

    const trade = (await db.trade.findUnique({
      where: { id: tradeId },
      include: { listing: true },
    })) as TradeWithListing | null;

    if (!trade) {
      return errorResponse("Trade not found", 404);
    }

    if (trade.status !== TradeStatus.DISPUTED) {
      return errorResponse("Trade must be in DISPUTED status", 409);
    }

    const recommendation = await generateDisputeSummary(
      JSON.parse(JSON.stringify(trade)) as TradeWithListing,
    );

    return json(recommendation);
  } catch (error) {
    return handleRouteError(error);
  }
}
