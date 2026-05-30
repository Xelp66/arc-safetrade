import { TradeStatus } from "@prisma/client";

import { TradeWithListing } from "@/lib/marketplace";

export type DisputeResolutionSuggestion =
  | "RELEASE_TO_SELLER"
  | "REFUND_BUYER"
  | "NEED_MORE_INFO";

export type DisputeSummaryResponse = {
  summary: string;
  riskFlags: string[];
  suggestedResolution: DisputeResolutionSuggestion;
  reasoning: string;
  provider: string;
  isMocked: boolean;
};

const jsonSchema = {
  name: "dispute_recommendation",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      riskFlags: {
        type: "array",
        items: { type: "string" },
      },
      suggestedResolution: {
        type: "string",
        enum: ["RELEASE_TO_SELLER", "REFUND_BUYER", "NEED_MORE_INFO"],
      },
      reasoning: { type: "string" },
    },
    required: ["summary", "riskFlags", "suggestedResolution", "reasoning"],
  },
} as const;

export async function generateDisputeSummary(
  trade: TradeWithListing,
): Promise<DisputeSummaryResponse> {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() ?? "mock";
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

  if (provider !== "mock" && apiKey) {
    try {
      return await generateProviderSummary(trade, provider, apiKey);
    } catch {
      return {
        ...generateDeterministicSummary(trade),
        provider: `${provider}-fallback`,
        isMocked: true,
      };
    }
  }

  return {
    ...generateDeterministicSummary(trade),
    provider: "mock",
    isMocked: true,
  };
}

async function generateProviderSummary(
  trade: TradeWithListing,
  provider: string,
  apiKey: string,
): Promise<DisputeSummaryResponse> {
  if (provider !== "openai") {
    throw new Error("Unsupported provider");
  }

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-5-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(trade),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Provider request failed");
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Provider response missing content");
  }

  const parsed = JSON.parse(content) as Omit<
    DisputeSummaryResponse,
    "provider" | "isMocked"
  >;

  return {
    summary: parsed.summary,
    riskFlags: parsed.riskFlags,
    suggestedResolution: parsed.suggestedResolution,
    reasoning: parsed.reasoning,
    provider,
    isMocked: false,
  };
}

function buildSystemPrompt() {
  return [
    "You are an advisory dispute review assistant for an escrow marketplace.",
    "Summarize the case, flag risks, and suggest a non-binding recommendation.",
    "Never claim legal finality.",
    "Never state that funds will definitely be released or refunded.",
    "Never make irreversible decisions automatically.",
    "Always frame the output as advisory and requiring explicit admin confirmation.",
    "If the evidence is incomplete, prefer NEED_MORE_INFO.",
    "Return only valid JSON that matches the requested schema.",
  ].join(" ");
}

function buildUserPrompt(trade: TradeWithListing) {
  return JSON.stringify(
    {
      tradeId: trade.id,
      contractTradeId: trade.contractTradeId,
      status: trade.status,
      amount: trade.amount,
      buyerAddress: trade.buyerAddress,
      sellerAddress: trade.sellerAddress,
      disputeReason: trade.disputeReason,
      trackingNumber: trade.trackingNumber,
      txHashes: {
        createTxHash: trade.createTxHash,
        fundTxHash: trade.fundTxHash,
        shippedTxHash: trade.shippedTxHash,
        completedTxHash: trade.completedTxHash,
        disputeTxHash: trade.disputeTxHash,
        resolveTxHash: trade.resolveTxHash,
      },
      listing: {
        title: trade.listing.title,
        description: trade.listing.description,
        city: trade.listing.city,
        category: trade.listing.category,
      },
      rules: {
        allowedSuggestions: [
          "RELEASE_TO_SELLER",
          "REFUND_BUYER",
          "NEED_MORE_INFO",
        ],
        note: "Recommendation is advisory only. Admin must execute the final onchain resolution.",
      },
    },
    null,
    2,
  );
}

function generateDeterministicSummary(
  trade: TradeWithListing,
): Omit<DisputeSummaryResponse, "provider" | "isMocked"> {
  const normalizedReason = (trade.disputeReason || "").toLowerCase();
  const riskFlags = collectRiskFlags(trade, normalizedReason);
  const suggestedResolution = chooseSuggestion(trade, normalizedReason, riskFlags);

  return {
    summary: buildSummary(trade),
    riskFlags,
    suggestedResolution,
    reasoning: buildReasoning(trade, normalizedReason, suggestedResolution, riskFlags),
  };
}

function collectRiskFlags(trade: TradeWithListing, normalizedReason: string) {
  const flags: string[] = [];

  if (!trade.disputeReason) {
    flags.push("No dispute reason was saved in the database.");
  }

  if (trade.status === TradeStatus.DISPUTED && !trade.disputeTxHash) {
    flags.push("Dispute status exists locally but dispute transaction hash is missing.");
  }

  if (!trade.fundTxHash) {
    flags.push("Escrow funding transaction hash is missing.");
  }

  if (normalizedReason.includes("not received") || normalizedReason.includes("never arrived")) {
    flags.push("Buyer claims the item was not received.");
  }

  if (
    normalizedReason.includes("damaged") ||
    normalizedReason.includes("fake") ||
    normalizedReason.includes("wrong item") ||
    normalizedReason.includes("not as described")
  ) {
    flags.push("Buyer reports a quality or authenticity issue.");
  }

  if (trade.shippedTxHash && !trade.trackingNumber) {
    flags.push("Seller marked shipped but no tracking number was provided.");
  }

  if (!trade.shippedTxHash && trade.trackingNumber) {
    flags.push("Tracking number exists locally without an onchain shipped record.");
  }

  if (
    normalizedReason.includes("delivered") ||
    normalizedReason.includes("tracking") ||
    normalizedReason.includes("stalling")
  ) {
    flags.push("The dispute references delivery evidence or post-delivery disagreement.");
  }

  return flags;
}

function chooseSuggestion(
  trade: TradeWithListing,
  normalizedReason: string,
  riskFlags: string[],
): DisputeResolutionSuggestion {
  const shippingEvidence = Boolean(trade.shippedTxHash && trade.trackingNumber);
  const buyerComplaint =
    normalizedReason.includes("not received") ||
    normalizedReason.includes("never arrived") ||
    normalizedReason.includes("damaged") ||
    normalizedReason.includes("fake") ||
    normalizedReason.includes("wrong item") ||
    normalizedReason.includes("not as described");
  const sellerLean =
    normalizedReason.includes("delivered") ||
    normalizedReason.includes("tracking shows delivered") ||
    normalizedReason.includes("buyer stalling");

  if (buyerComplaint && !shippingEvidence) {
    return "REFUND_BUYER";
  }

  if (sellerLean && shippingEvidence) {
    return "RELEASE_TO_SELLER";
  }

  if (riskFlags.length >= 2 || trade.status !== TradeStatus.DISPUTED) {
    return "NEED_MORE_INFO";
  }

  return shippingEvidence ? "NEED_MORE_INFO" : "REFUND_BUYER";
}

function buildSummary(trade: TradeWithListing) {
  return [
    `Listing "${trade.listing.title}" is in ${trade.status} status for ${trade.amount} USDC.`,
    `The buyer ${trade.buyerAddress} opened or is involved in a dispute against seller ${trade.sellerAddress}.`,
    trade.disputeReason
      ? `Recorded dispute reason: ${trade.disputeReason}`
      : "No dispute reason is recorded yet.",
    trade.trackingNumber
      ? `Tracking number on file: ${trade.trackingNumber}.`
      : "No tracking number is recorded in the trade.",
  ].join(" ");
}

function buildReasoning(
  trade: TradeWithListing,
  normalizedReason: string,
  suggestion: DisputeResolutionSuggestion,
  riskFlags: string[],
) {
  if (suggestion === "RELEASE_TO_SELLER") {
    return [
      "The current recommendation leans toward the seller because shipping evidence is present and the dispute text suggests a delivery-confirmation disagreement.",
      "This is not a final decision and should be confirmed against offchain proof such as courier tracking or chat history before any onchain action.",
    ].join(" ");
  }

  if (suggestion === "REFUND_BUYER") {
    return [
      "The current recommendation leans toward the buyer because the dispute describes a missing or defective item and the saved trade data does not provide strong shipping evidence.",
      "This remains advisory only and should be validated by the admin before any refund is executed onchain.",
    ].join(" ");
  }

  return [
    "The case does not have enough consistent evidence for a confident directional recommendation.",
    riskFlags.length > 0
      ? `Open issues include: ${riskFlags.join(" ")}`
      : "The recorded dispute data is incomplete.",
    normalizedReason
      ? "The admin should request additional evidence from both sides before taking an irreversible onchain action."
      : "The admin should collect a written explanation from both buyer and seller before resolving the dispute.",
  ].join(" ");
}
