import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  PackageCheck,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { NetworkStatusCard } from "@/components/network-status-card";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const trustIndicators = [
  "Non-custodial escrow",
  "USDC on Arc Testnet",
  "Buyer confirmation",
  "Seller protection",
  "Dispute resolution",
] as const;

const roleCards = [
  {
    title: "Buyer",
    description:
      "Locks payment safely in escrow and confirms delivery when the item arrives.",
    icon: WalletCards,
  },
  {
    title: "Seller",
    description:
      "Ships only after seeing that USDC is locked in the smart contract.",
    icon: PackageCheck,
  },
  {
    title: "Admin",
    description:
      "Resolves disputes if something goes wrong and syncs the final outcome onchain.",
    icon: Scale,
  },
] as const;

const steps = [
  "Seller lists an item",
  "Buyer starts SafeTrade",
  "Buyer locks USDC in escrow",
  "Seller ships the item",
  "Buyer confirms delivery and seller receives funds",
] as const;

const demoChecklist = [
  "Create a listing as seller",
  "Connect a buyer wallet",
  "Start SafeTrade",
  "Fund escrow with USDC",
  "Mark as shipped",
  "Confirm delivery",
  "Open dispute if needed",
] as const;

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/" />

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_90px_-48px_rgba(15,118,110,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_30%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-12">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
                Built on Arc Testnet
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Trust layer for second-hand payments
              </Badge>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Safe second-hand payments with USDC escrow on Arc
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-foreground/90">
                Arc SafeTrade protects buyers and sellers by locking USDC in a
                smart contract until delivery is confirmed.
              </p>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                Instead of trusting a stranger, both sides trust escrow. The buyer
                funds the contract, the seller ships after payment is locked, and
                funds are released only when delivery is confirmed.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/marketplace"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}
              >
                Browse Marketplace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sell"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "rounded-full px-7",
                )}
              >
                Create a Listing
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {trustIndicators.map((item) => (
                <Badge key={item} variant="outline" className="rounded-full bg-background/60">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <NetworkStatusCard />
            <Card className="rounded-[1.75rem] border border-border/70 bg-background/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="size-5 text-primary" />
                  Why escrow matters
                </CardTitle>
                <CardDescription>
                  SafeTrade is designed for second-hand deals where neither side
                  wants to move first without proof.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4">
                  <p className="text-sm font-medium">Buyer confidence</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Pay into escrow instead of sending funds directly to a stranger.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4">
                  <p className="text-sm font-medium">Seller confidence</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Ship only after the escrow contract proves USDC is already locked.
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                  <p className="text-sm font-medium">Transparent settlement</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Arc Testnet keeps the payment trail, trade status, and dispute
                    outcome visible at every step.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            The trust problem in second-hand sales
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Second-hand deals need a trust layer
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CircleDollarSign className="size-5 text-primary" />
                Buyer risk
              </CardTitle>
              <CardDescription className="text-base text-foreground">
                You pay first, but the item may never arrive.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PackageCheck className="size-5 text-primary" />
                Seller risk
              </CardTitle>
              <CardDescription className="text-base text-foreground">
                You ship first, but the buyer may never pay.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-[1.5rem] border border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="size-5 text-primary" />
                SafeTrade
              </CardTitle>
              <CardDescription className="text-base text-foreground">
                SafeTrade reduces this risk with escrow.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="py-4 sm:py-6">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            How SafeTrade works
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A simple escrow flow for buyer and seller
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <Card key={step} className="rounded-[1.5rem] border border-border/70 bg-card/80">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground lg:last:hidden" />
                </div>
                <CardDescription className="text-sm leading-6 text-foreground">
                  {step}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Roles in the flow
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Buyer, seller, and admin each have a clear job
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon;

            return (
              <Card key={role.title} className="rounded-[1.5rem] border border-border/70 bg-card/85">
                <CardHeader className="space-y-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {role.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-4 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
            <CardHeader className="space-y-4">
              <Badge variant="outline" className="w-fit rounded-full">
                Built for stablecoin payments on Arc
              </Badge>
              <div className="space-y-3">
                <CardTitle className="text-3xl">Why Arc?</CardTitle>
                <CardDescription className="text-base leading-7">
                  Arc provides a fast, stablecoin-native environment for real-world
                  payment flows. SafeTrade uses Arc Testnet and USDC escrow to
                  demonstrate how marketplace payments can become safer and more
                  transparent.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "Arc Testnet",
                "USDC escrow",
                "Smart contract settlement",
                "Transparent transaction history",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
            <CardHeader className="space-y-4">
              <Badge className="w-fit rounded-full">Try the demo flow</Badge>
              <div className="space-y-3">
                <CardTitle className="text-3xl">Start a safer trade today</CardTitle>
                <CardDescription className="text-base leading-7">
                  The full MVP is already live: listings, escrow funding, shipping,
                  buyer confirmation, and dispute resolution.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3">
                {demoChecklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-4 py-3"
                  >
                    <BadgeCheck className="size-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/marketplace"
                  className={cn(buttonVariants(), "rounded-full")}
                >
                  Open Marketplace
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
                >
                  Seller Dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-8 pt-12">
        <Card className="rounded-[2rem] border border-border/70 bg-card/85">
          <CardContent className="flex flex-col gap-5 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                SafeTrade mission
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                A marketplace should not require strangers to take blind risk.
              </h2>
            </div>
            <Link
              href="/marketplace"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-7")}
            >
              Browse protected listings
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
