import Link from "next/link";

import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/arc-tools", label: "Arc Tools" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/sell", label: "Sell" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin/disputes", label: "Disputes" },
] as const;

export function SiteHeader({
  currentPath,
}: {
  currentPath?: string;
}) {
  return (
    <header className="sticky top-0 z-30 mx-auto mb-8 flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border border-border/70 bg-card/80 px-5 py-3 shadow-[0_12px_40px_-28px_rgba(15,118,110,0.45)] backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            AS
          </div>
          <div>
            <p className="text-sm font-medium">Arc SafeTrade</p>
            <p className="text-xs text-muted-foreground">
              Arc escrow marketplace
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-7 items-center justify-center rounded-full px-4 text-[0.8rem] font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                currentPath === item.href
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <ConnectWalletButton />
    </header>
  );
}
