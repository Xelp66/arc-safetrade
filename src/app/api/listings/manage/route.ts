import { getDb } from "@/lib/db";
import { errorResponse, handleRouteError, json } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sellerAddress = searchParams.get("sellerAddress")?.trim().toLowerCase();

    if (!sellerAddress) {
      return errorResponse("sellerAddress is required", 400);
    }

    const listings = await db.listing.findMany({
      where: { sellerAddress },
      include: {
        trades: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return json(listings);
  } catch (error) {
    return handleRouteError(error);
  }
}
