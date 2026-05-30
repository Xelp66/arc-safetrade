export const arcSafeTradeEscrowAbi = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "createTrade",
    inputs: [
      { name: "seller", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "fundTrade",
    inputs: [{ name: "tradeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "markShipped",
    inputs: [{ name: "tradeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "confirmReceived",
    inputs: [{ name: "tradeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "openDispute",
    inputs: [{ name: "tradeId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "resolveDispute",
    inputs: [
      { name: "tradeId", type: "uint256", internalType: "uint256" },
      { name: "releaseToSeller", type: "bool", internalType: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getTrade",
    inputs: [{ name: "tradeId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct ArcSafeTradeEscrow.Trade",
        components: [
          { name: "buyer", type: "address", internalType: "address" },
          { name: "seller", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "status", type: "uint8", internalType: "enum ArcSafeTradeEscrow.TradeStatus" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
          { name: "fundedAt", type: "uint256", internalType: "uint256" },
          { name: "shippedAt", type: "uint256", internalType: "uint256" },
          { name: "completedAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
  },
  {
    type: "event",
    anonymous: false,
    name: "TradeCreated",
    inputs: [
      { name: "tradeId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "buyer", type: "address", indexed: true, internalType: "address" },
      { name: "seller", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
  },
] as const;
