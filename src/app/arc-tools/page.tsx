import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  Layers3,
  MoveRight,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toolCards = [
  {
    title: "Send USDC",
    status: "MVP-ready",
    icon: MoveRight,
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    description:
      "Same-chain wallet-to-wallet transfer on Arc for simple USDC movement between buyer, seller, and support flows.",
    detail:
      "This is the most direct funding primitive for Arc SafeTrade users who already hold testnet USDC on Arc.",
  },
  {
    title: "Bridge USDC to Arc",
    status: "Coming soon",
    icon: ArrowUpRight,
    accent: "border-amber-500/30 bg-amber-500/10 text-amber-800",
    description:
      "App Kit Bridge can move USDC across chains so users can arrive on Arc without learning a custom deposit path first.",
    detail:
      "The intended flow is chain-aware onboarding into Arc Testnet with a cleaner funding path than manual bridge instructions.",
  },
  {
    title: "Swap stablecoins",
    status: "Coming soon",
    icon: Repeat2,
    accent: "border-sky-500/30 bg-sky-500/10 text-sky-700",
    description:
      "App Kit Swap supports stablecoin exchange patterns, including USDC and EURC routing on Arc Testnet.",
    detail:
      "This prepares the marketplace for future buyer funding paths where a user arrives with the wrong stablecoin but still completes escrow.",
  },
  {
    title: "Unified Balance",
    status: "Coming soon",
    icon: Layers3,
    accent: "border-violet-500/30 bg-violet-500/10 text-violet-700",
    description:
      "Unified Balance lets users consolidate USDC across chains and spend on Arc through a chain-abstracted balance layer.",
    detail:
      "The long-term product direction is Arc-native spending without forcing users to think in terms of isolated per-chain balances.",
  },
] as const;

const capabilityPoints = [
  "App Kit supports Send, Bridge, Swap, and Unified Balance.",
  "Unified Balance lets users consolidate USDC across chains and spend on Arc.",
  "Swap supports USDC/EURC on Arc Testnet.",
] as const;

const roadmapSteps = [
  {
    label: "Now",
    title: "Wallet-visible funding UX",
    description:
      "Expose the funding primitives around Arc so users understand how escrow capital reaches the chain.",
  },
  {
    label: "Next",
    title: "Bridge and swap entry points",
    description:
      "Add guided App Kit entry flows for cross-chain USDC and stablecoin conversion into Arc settlement.",
  },
  {
    label: "Later",
    title: "Unified spending",
    description:
      "Move toward chain-abstracted USDC balance and one-click funding into SafeTrade escrow.",
  },
] as const;

export default function ArcToolsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/arc-tools" />

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-8 shadow-[0_26px_90px_-52px_rgba(15,118,110,0.55)] lg:p-12 dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-accent px-4 py-1 text-sm text-accent-foreground">
                Arc Funding Tools
              </Badge>
              <Badge variant="outline" className="rounded-full">
                App Kit showcase
              </Badge>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Build the path into Arc before asking users to fund escrow on Arc.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                This page frames Arc App Kit concepts around real marketplace funding
                needs. The flows are not wired yet, but the product surface is ready
                for Send, Bridge, Swap, and Unified Balance integrations.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/marketplace"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-7",
                )}
              >
                Browse Marketplace
                <ArrowRight className="size-4" />
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7"
                disabled
              >
                App Kit Flows Coming Soon
              </Button>
            </div>
          </div>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="size-5 text-primary" />
                Arc App Kit concepts
              </CardTitle>
              <CardDescription>
                Funding and balance tools that can sit alongside SafeTrade escrow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {capabilityPoints.map((point) => (
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
      </section>

      <section className="py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Capability map
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Four Arc funding primitives around one escrow marketplace.
            </h2>
          </div>
          <Badge variant="outline" className="rounded-full px-4 py-1 text-sm">
            Arc developer showcase
          </Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {toolCards.map((tool) => {
            const Icon = tool.icon;

            return (
              <Card
                key={tool.title}
                className="group rounded-[1.75rem] border border-border/70 bg-card/85 transition-colors hover:border-primary/30"
              >
                <CardHeader className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{tool.title}</CardTitle>
                        <CardDescription className="mt-2 leading-6">
                          {tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${tool.accent}`}
                    >
                      {tool.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
                    {tool.detail}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Integration surface</p>
                      <p className="text-sm text-muted-foreground">
                        UI-ready now, transaction flow later.
                      </p>
                    </div>
                    <Coins className="size-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 pb-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle>Why this matters for SafeTrade</CardTitle>
            <CardDescription>
              Escrow adoption improves when the funding step is visible and low-friction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Arc SafeTrade already depends on users holding USDC on Arc Testnet.
              This tools page makes that dependency legible instead of hiding it
              behind a generic connect-wallet step.
            </p>
            <p>
              The end state is a marketplace where funding, bridging, swapping,
              and escrow all feel like one product surface instead of four unrelated
              tools.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border border-border/70 bg-linear-to-br from-card via-card to-secondary/35">
          <CardHeader>
            <CardTitle>Adoption roadmap</CardTitle>
            <CardDescription>
              A staged path from current demo UX to future chain-abstracted funding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmapSteps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border/60 bg-background/55 px-4 py-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{step.title}</p>
                  <Badge variant="outline" className="rounded-full">
                    {step.label}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
