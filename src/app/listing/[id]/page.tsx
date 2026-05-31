import { notFound } from "next/navigation";
import { CircleDollarSign, MapPin, PackageCheck, ShieldCheck, Tag } from "lucide-react";

import { ListingOwnerActions } from "@/components/listing-owner-actions";
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
import { getDb } from "@/lib/db";
import { Listing, Trade, formatPriceLabel } from "@/lib/marketplace";

type ListingDetailResponse = Listing & { trades: Trade[] };

const timelineLabels = [
  "Created",
  "Escrow funded",
  "Shipped",
  "Completed",
] as const;

function getTimelineIndex(status: Trade["status"]) {
  switch (status) {
    case "CREATED":
      return 0;
    case "FUNDED":
      return 1;
    case "SHIPPED":
      return 2;
    case "COMPLETED":
      return 3;
    case "DISPUTED":
      return 2;
    case "REFUNDED":
      return 3;
    default:
      return 0;
  }
}

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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  const latestTrade = listing?.trades[0] ?? null;

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

              <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Escrow protection</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Your USDC will be locked in escrow. The seller receives funds
                      only after you confirm delivery.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>Seller controls</CardTitle>
              <CardDescription>
                Manage this listing only while it is active and no SafeTrade has
                started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListingOwnerActions listing={listing} trades={listing.trades} />
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>SafeTrade guidance</CardTitle>
              <CardDescription>
                Clear expectations for buyer and seller before escrow starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Buyer protection</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Start SafeTrade only when you are ready to lock USDC in escrow
                      on Arc Testnet.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <PackageCheck className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Seller protection</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      This is your listing. Once a buyer funds escrow, you can ship
                      with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <TradeCreationPanel
            listingId={listing.id}
            sellerAddress={listing.sellerAddress}
            listingStatus={listing.status}
          />

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>SafeTrade activity</CardTitle>
              <CardDescription>
                Trade records and timeline updates connected to this listing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestTrade ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium">Current transaction timeline</p>
                  <div className="mt-3 grid gap-3">
                    {timelineLabels.map((label, index) => {
                      const complete =
                        latestTrade.status === "DISPUTED"
                          ? index <= 2
                          : index <= getTimelineIndex(latestTrade.status);

                      return (
                        <div
                          key={label}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            complete
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-border/60 bg-background/50"
                          }`}
                        >
                          <span className="font-medium">{label}</span>
                        </div>
                      );
                    })}
                    {latestTrade.status === "DISPUTED" ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
                        Completed / Disputed: admin review is required before funds
                        move.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

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
