import { ListingStatus, Prisma } from "@prisma/client";

import { errorResponse, handleRouteError, json } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
  getCancelListingBlockReason,
  getEditListingBlockReason,
} from "@/lib/listing-management";
import { updateListingSchema } from "@/lib/validators";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateListingSchema.parse(body);
    const db = getDb();

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        trades: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (listing.sellerAddress.toLowerCase() !== parsed.sellerAddress.toLowerCase()) {
      return errorResponse("Only the listing seller can edit this listing", 403);
    }

    const editBlockReason = getEditListingBlockReason(
      { status: listing.status },
      listing.trades,
    );

    if (editBlockReason) {
      return errorResponse(editBlockReason, 400);
    }

    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description,
        price: new Prisma.Decimal(parsed.price),
        imageUrl: parsed.imageUrl || null,
        category: parsed.category || null,
        city: parsed.city || null,
      },
    });

    return json(updatedListing);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { sellerAddress?: string };
    const sellerAddress = body.sellerAddress?.trim().toLowerCase();

    if (!sellerAddress) {
      return errorResponse("Seller address is required", 400);
    }

    const db = getDb();
    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        trades: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!listing) {
      return errorResponse("Listing not found", 404);
    }

    if (listing.sellerAddress.toLowerCase() !== sellerAddress) {
      return errorResponse("Only the listing seller can cancel this listing", 403);
    }

    const cancelBlockReason = getCancelListingBlockReason(
      { status: listing.status },
      listing.trades,
    );

    if (cancelBlockReason) {
      return errorResponse(cancelBlockReason, 400);
    }

    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        status: ListingStatus.CANCELLED,
      },
    });

    return json(updatedListing);
  } catch (error) {
    return handleRouteError(error);
  }
}
