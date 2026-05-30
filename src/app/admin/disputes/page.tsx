import { TradeStatus } from "@prisma/client";

import { AdminDisputesPanel } from "@/components/admin-disputes-panel";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { TradeWithListing } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

async function getDisputedTrades() {
  const db = getDb();

  const disputes = await db.trade.findMany({
    where: {
      status: TradeStatus.DISPUTED,
    },
    include: {
      listing: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return JSON.parse(JSON.stringify(disputes)) as TradeWithListing[];
}

export default async function AdminDisputesPage() {
  const disputes = await getDisputedTrades();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12">
      <SiteHeader currentPath="/admin/disputes" />

      <section className="mb-8 rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-[0_20px_80px_-44px_rgba(15,118,110,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge className="rounded-full">Arc SafeTrade Admin</Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              Dispute review queue
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              Review disputed escrow trades and resolve them on Arc Testnet with
              the configured admin wallet.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full text-sm">
            {disputes.length} open dispute{disputes.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </section>

      <Card className="mb-6 rounded-[1.75rem] border border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>Resolution policy</CardTitle>
          <CardDescription>
            Seller wins move the listing to SOLD. Buyer refunds return the listing
            to ACTIVE for this MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Admin arbitration is centralized in MVP. Future version will add
          agent-assisted dispute analysis.
        </CardContent>
      </Card>

      <AdminDisputesPanel disputes={disputes} />
    </main>
  );
}
