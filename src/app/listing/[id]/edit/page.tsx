import { notFound } from "next/navigation";

import { EditListingForm } from "@/components/edit-listing-form";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { Listing, Trade } from "@/lib/marketplace";

type ListingDetailResponse = Listing & { trades: Trade[] };

async function getListing(id: string) {
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
    return null;
  }

  return JSON.parse(JSON.stringify(listing)) as ListingDetailResponse;
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader />

      <section className="mb-8 space-y-4">
        <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
          Manage listing
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Edit {listing.title}
        </h1>
      </section>

      <EditListingForm listing={listing} trades={listing.trades} />
    </main>
  );
}
