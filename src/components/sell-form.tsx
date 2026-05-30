"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAccount } from "wagmi";

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

const initialFormState: FormState = {
  title: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
  city: "",
};

export function SellForm() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!address) {
      setError("Connect your wallet before creating a listing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await fetch("/api/users/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
        }),
      });

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sellerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing");
      }

      setForm(initialFormState);
      router.push(`/listing/${data.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while creating the listing",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.7fr]">
      <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Create a marketplace listing</CardTitle>
          <CardDescription>
            Publish a second-hand item for Arc SafeTrade testnet buyers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/10">
              <CardHeader>
                <CardTitle className="text-base">Wallet required</CardTitle>
                <CardDescription>
                  Connect your Arc-compatible wallet to create a listing.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Vintage camera with lens kit"
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
                  placeholder="Condition, what's included, and any flaws buyers should know about."
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
                  placeholder="125.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="Electronics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  placeholder="Istanbul"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={!isConnected || isSubmitting}
              className="rounded-full px-6"
            >
              {isSubmitting ? "Creating listing..." : "Create listing"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="text-base">
              This is a testnet demo. Do not use real funds.
            </CardTitle>
            <CardDescription>
              Listings and trades here are for Arc Testnet flows only. Use
              disposable wallets and demo inventory.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle className="text-base">Seller flow</CardTitle>
            <CardDescription>
              Create listing, wait for a buyer to reserve it, then continue the
              escrow process from the trade view.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
