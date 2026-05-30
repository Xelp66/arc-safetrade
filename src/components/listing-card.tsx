import Link from "next/link";
import { MapPin, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Listing, formatPriceLabel } from "@/lib/marketplace";
import { shortenAddress } from "@/lib/arc";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="h-full rounded-[1.5rem] border border-border/70 bg-card/85 shadow-[0_18px_48px_-36px_rgba(15,118,110,0.45)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[1.5rem] border-b border-border/60 bg-muted">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.22),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.04))] text-sm text-muted-foreground">
            No image provided
          </div>
        )}
      </div>
      <CardHeader className="space-y-3">
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
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg">{listing.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-6">
            {listing.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold text-foreground">
          {formatPriceLabel(listing.price)}
        </div>
        <p className="text-sm text-muted-foreground">
          Seller: {shortenAddress(listing.sellerAddress)}
        </p>
      </CardContent>
      <CardFooter className="mt-auto justify-between gap-3 border-t border-border/60 bg-background/40">
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Arc SafeTrade
        </span>
        <Button
          render={<Link href={`/listing/${listing.id}`} />}
          className="rounded-full"
        >
          View listing
        </Button>
      </CardFooter>
    </Card>
  );
}
