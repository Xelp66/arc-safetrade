import { BadgeCheck, CircleDollarSign, Package, ShieldCheck, Wallet } from "lucide-react";

import { Trade } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

const timelineSteps = [
  {
    key: "local",
    title: "Created locally",
    description: "Trade record exists in the database.",
  },
  {
    key: "onchain",
    title: "Created onchain",
    description: "Escrow tradeId has been created in the contract.",
  },
  {
    key: "funded",
    title: "Funded",
    description: "Buyer locks USDC into escrow.",
  },
  {
    key: "shipped",
    title: "Shipped",
    description: "Seller marks the package as sent.",
  },
  {
    key: "completed",
    title: "Completed",
    description: "Buyer confirms delivery and settlement releases.",
  },
] as const;

function getStepState(trade: Trade, stepKey: (typeof timelineSteps)[number]["key"]) {
  switch (stepKey) {
    case "local":
      return true;
    case "onchain":
      return trade.contractTradeId !== null;
    case "funded":
      return ["FUNDED", "SHIPPED", "COMPLETED"].includes(trade.status);
    case "shipped":
      return ["SHIPPED", "COMPLETED"].includes(trade.status);
    case "completed":
      return trade.status === "COMPLETED";
    default:
      return false;
  }
}

const stepIcons = {
  local: ShieldCheck,
  onchain: Wallet,
  funded: CircleDollarSign,
  shipped: Package,
  completed: BadgeCheck,
} as const;

export function TradeTimeline({ trade }: { trade: Trade }) {
  return (
    <div className="space-y-3">
      {timelineSteps.map((step) => {
        const complete = getStepState(trade, step.key);
        const Icon = stepIcons[step.key];

        return (
          <div
            key={step.key}
            className={cn(
              "rounded-2xl border px-4 py-3 transition-colors",
              complete
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-border/60 bg-background/50",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-9 items-center justify-center rounded-full",
                  complete ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
