import { ListingStatus, Prisma } from "@prisma/client";

import { getDb } from "@/lib/db";
import { handleRouteError, json } from "@/lib/api";
import { createListingSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const listings = await db.listing.findMany({
      where: { status: ListingStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });

    return json(listings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createListingSchema.parse(body);
    const db = getDb();

    const listing = await db.listing.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        price: new Prisma.Decimal(parsed.price),
        imageUrl: parsed.imageUrl || null,
        category: parsed.category || null,
        city: parsed.city || null,
        sellerAddress: parsed.sellerAddress,
      },
    });

    return json(listing, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
