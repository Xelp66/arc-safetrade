import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { NetworkStatusCard } from "@/components/network-status-card";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const arcBadges = [
  {
    icon: Coins,
    title: "USDC gas",
    description:
      "Arc uses USDC for gas, so settlement currency and network fees stay aligned.",
  },
  {
    icon: BadgeCheck,
    title: "Arc Testnet",
    description:
      "Build and test escrow flows end-to-end without touching production funds.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow",
    description:
      "Buyers stop sending direct payments first and move through a protected trade flow.",
  },
  {
    icon: Gauge,
    title: "Fast settlement",
    description:
      "Once delivery is confirmed, the contract can release funds immediately to the seller.",
  },
] as const;

const problemPoints = [
  "Second-hand marketplaces force strangers to trust each other before either side has proof.",
  "Sellers worry about shipping first and then fighting payment issues later.",
  "Buyers worry that direct payment can disappear before the item ever arrives.",
] as const;

const solutionSteps = [
  "Buyer reserves a listing and creates a local SafeTrade record.",
  "Buyer funds escrow with USDC on Arc Testnet.",
  "Seller ships while funds remain locked.",
  "Buyer confirms delivery and settlement is released.",
] as const;

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/" />

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-[0_24px_90px_-48px_rgba(15,118,110,0.5)]">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
                Arc SafeTrade
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Escrow-first marketplace
              </Badge>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Second-hand trade breaks down when trust has to come before proof.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Arc SafeTrade turns direct person-to-person risk into an escrow
                flow on Arc Network. Buyers lock USDC, sellers ship, and payment
                releases only after delivery is confirmed.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                render={<Link href="/marketplace" />}
                size="lg"
                className="rounded-full px-7"
              >
                Browse Marketplace
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href="/sell" />}
                size="lg"
                variant="outline"
                className="rounded-full px-7"
              >
                Sell an Item
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {arcBadges.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.title}
                    className="rounded-[1.5rem] border border-border/60 bg-background/55"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="leading-6">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <NetworkStatusCard />
            <Card className="rounded-[1.75rem] border border-border/70 bg-linear-to-b from-secondary via-background to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  Why this exists
                </CardTitle>
                <CardDescription>
                  Arc Network usage stays visible instead of hidden behind a generic checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {problemPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {point}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Solution flow
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Arc SafeTrade replaces trust-first checkout with proof-first settlement.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {solutionSteps.map((step, index) => (
            <Card
              key={step}
              className="rounded-[1.5rem] border border-border/70 bg-card/80"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    0{index + 1}
                  </span>
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <CardDescription className="text-sm leading-6 text-foreground">
                  {step}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
