import { getDb } from "@/lib/db";
import { errorResponse, handleRouteError, json } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        trades: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    return json(listing);
  } catch (error) {
    return handleRouteError(error);
  }
}
