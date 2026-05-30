import { notFound } from "next/navigation";
import { MapPin, Tag } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { TradeCreationPanel } from "@/components/trade-creation-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { shortenAddress } from "@/lib/arc";
import { Listing, Trade, formatPriceLabel } from "@/lib/marketplace";

type ListingDetailResponse = Listing & { trades: Trade[] };

async function getListing(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/listings/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load listing");
  }

  return (await response.json()) as ListingDetailResponse;
}

export default async function ListingDetailPage({
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.75fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/85">
            <div className="aspect-[16/10] overflow-hidden border-b border-border/60 bg-muted">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.2),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.06))] text-sm text-muted-foreground">
                  No image provided
                </div>
              )}
            </div>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {listing.category ? (
                  <Badge variant="outline" className="rounded-full">
                    <Tag className="size-3" />
                    {listing.category}
                  </Badge>
                ) : null}
                {listing.city ? (
                  <Badge variant="outline" className="rounded-full">
                    <MapPin className="size-3" />
                    {listing.city}
                  </Badge>
                ) : null}
                <Badge className="rounded-full">Escrow eligible</Badge>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl">{listing.title}</CardTitle>
                <CardDescription className="text-base leading-7">
                  {listing.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Price
                </p>
                <p className="mt-2 text-4xl font-semibold">
                  {formatPriceLabel(listing.price)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="rounded-[1.25rem] border border-border/70 bg-background/50">
                  <CardHeader>
                    <CardDescription>Seller</CardDescription>
                    <CardTitle className="text-base">
                      {shortenAddress(listing.sellerAddress)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-[1.25rem] border border-border/70 bg-background/50">
                  <CardHeader>
                    <CardDescription>Status</CardDescription>
                    <CardTitle className="text-base">{listing.status}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <TradeCreationPanel
            listingId={listing.id}
            sellerAddress={listing.sellerAddress}
          />

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>Activity snapshot</CardTitle>
              <CardDescription>
                Local trade records created for this listing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {listing.trades.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No SafeTrade records yet.
                </p>
              ) : (
                listing.trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">
                        Trade #{trade.id.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className="rounded-full">
                        {trade.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
