# Arc SafeTrade

Arc SafeTrade is a second-hand marketplace escrow dApp foundation for Arc Network.

Buyers do not pay sellers directly. The intended flow is:

1. Buyer locks USDC into an escrow smart contract on Arc Testnet.
2. Seller ships the item.
3. Buyer confirms delivery.
4. Escrow releases USDC to the seller.
5. If needed, a dispute is opened and resolved by an admin.

This repository prepares the frontend, wallet layer, database schema, and contract tooling. The escrow smart contract itself is intentionally not implemented yet.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma
- PostgreSQL
- wagmi
- viem
- RainbowKit
- Hardhat
- Solidity tooling with OpenZeppelin

## Arc Network config

- Chain: Arc Testnet
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Gas token: `USDC`
- USDC ERC20 interface: `0x3600000000000000000000000000000000000000`
- USDC decimals: `6`

## Project structure

```text
.
|-- prisma/
|   `-- schema.prisma
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |   `-- ui/
|   `-- lib/
|-- contracts/
|-- scripts/
|-- test/
|-- hardhat.config.ts
`-- .env.example
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and fill in real values:

```powershell
Copy-Item .env.example .env
```

3. Start PostgreSQL and create a database named `arc_safetrade`.

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Start the Next.js app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Environment variables

Required values are documented in [.env.example](/C:/projeler/SafeTrade/.env.example).

- `DATABASE_URL`: Prisma connection string for PostgreSQL.
- `DIRECT_URL`: Direct PostgreSQL connection for Prisma migrations.
- `NEXT_PUBLIC_APP_URL`: Public app URL for wallet metadata.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID for RainbowKit.
- `NEXT_PUBLIC_ARC_RPC_URL`: Arc Testnet RPC URL.
- `NEXT_PUBLIC_ARC_EXPLORER_URL`: Arc explorer URL.
- `NEXT_PUBLIC_ARC_USDC_ADDRESS`: Arc USDC ERC20 interface address.
- `NEXT_PUBLIC_ARC_CHAIN_ID`: Arc Testnet chain ID.
- `ARC_ESCROW_ADMIN_ADDRESS`: Placeholder admin wallet for future dispute resolution flows.

## Useful scripts

- `npm run dev`: Start the Next.js app.
- `npm run lint`: Run ESLint.
- `npm run prisma:generate`: Generate the Prisma client.
- `npm run prisma:migrate`: Create and apply a development migration.
- `npm run hardhat:compile`: Compile Solidity contracts after they are added.

## Notes

- Wallet UI is configured for Arc Testnet through RainbowKit, wagmi, and viem.
- Prisma includes initial marketplace models for users, listings, escrow orders, and disputes.
- Hardhat is installed and configured for Arc Testnet, but no contracts are implemented yet.
