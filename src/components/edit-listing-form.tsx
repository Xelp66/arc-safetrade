"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAccount } from "wagmi";

import { Listing, Trade } from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  city: string;
};

export function EditListingForm({
  listing,
  trades,
}: {
  listing: Listing;
  trades: Trade[];
}) {
  const router = useRouter();
  const { address, isConnected, status } = useAccount();
  const [form, setForm] = useState<FormState>({
    title: listing.title,
    description: listing.description,
    price: listing.price,
    imageUrl: listing.imageUrl ?? "",
    category: listing.category ?? "",
    city: listing.city ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner =
    address?.toLowerCase() === listing.sellerAddress.toLowerCase();
  const isReconnecting = status === "reconnecting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!address) {
      setError("Connect the seller wallet before editing this listing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sellerAddress: address,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to update listing");
      }

      router.push(`/listing/${listing.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while updating the listing",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isReconnecting) {
    return (
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Reconnecting wallet</CardTitle>
          <CardDescription>
            Waiting for the seller wallet session to restore before editing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isConnected || !isOwner) {
    return (
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Seller wallet required</CardTitle>
          <CardDescription>
            Connect the wallet that created this listing to edit it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
      <CardHeader>
        <CardTitle>Edit listing</CardTitle>
        <CardDescription>
          Editing is only allowed while the listing is active and no SafeTrade has
          started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price (USDC)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </div>
          </div>

          {trades.length > 0 ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              This listing already has {trades.length} trade record
              {trades.length === 1 ? "" : "s"}. The API will block edits if any
              SafeTrade has started.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting} className="rounded-full px-6">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-6"
              onClick={() => router.push(`/listing/${listing.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
