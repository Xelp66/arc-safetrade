import { ListingStatus, Prisma, TradeStatus } from "@prisma/client";

import { getDb } from "@/lib/db";
import { errorResponse, handleRouteError, json } from "@/lib/api";
import { createTradeSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.toLowerCase();
    const status = searchParams.get("status") as TradeStatus | null;
    const db = getDb();

    if (!address) {
      const trades = await db.trade.findMany({
        where: status ? { status } : undefined,
        include: status ? { listing: true } : undefined,
        orderBy: { createdAt: "desc" },
      });

      return json(trades);
    }

    const [buying, selling] = await Promise.all([
      db.trade.findMany({
        where: { buyerAddress: address },
        orderBy: { createdAt: "desc" },
      }),
      db.trade.findMany({
        where: { sellerAddress: address },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return json({ buying, selling });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, buyerAddress } = createTradeSchema.parse(body);
    const db = getDb();

    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      return errorResponse("Listing is not available", 409);
    }

    if (listing.sellerAddress === buyerAddress) {
      return errorResponse("Buyer cannot be the seller", 400);
    }

    const trade = await db.$transaction(async (tx) => {
      const createdTrade = await tx.trade.create({
        data: {
          listingId: listing.id,
          buyerAddress,
          sellerAddress: listing.sellerAddress,
          amount: new Prisma.Decimal(listing.price),
          status: TradeStatus.CREATED,
        },
      });

      await tx.listing.update({
        where: { id: listing.id },
        data: { status: ListingStatus.RESERVED },
      });

      return createdTrade;
    });

    return json(trade, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
