import { z } from "zod";

const addressSchema = z
  .string()
  .trim()
  .min(1, "Address is required")
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address format")
  .transform((value) => value.toLowerCase());

const txHashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash");

export const upsertUserSchema = z.object({
  address: addressSchema,
  username: z.string().trim().min(1).max(32).optional(),
});

export const createListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(5000),
  price: z.coerce.number().positive("Price must be greater than zero"),
  imageUrl: z.string().trim().url("Invalid image URL").optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  sellerAddress: addressSchema,
});

export const updateListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().min(1, "Description is required").max(5000),
  price: z.coerce.number().positive("Price must be greater than zero"),
  imageUrl: z.string().trim().url("Invalid image URL").optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  sellerAddress: addressSchema,
});

export const createTradeSchema = z.object({
  listingId: z.string().trim().min(1, "Listing ID is required"),
  buyerAddress: addressSchema,
});

export const disputeSummarySchema = z.object({
  tradeId: z.string().trim().min(1, "Trade ID is required"),
});

export const updateTradeSchema = z
  .object({
    status: z
      .enum([
        "CREATED",
        "FUNDED",
        "SHIPPED",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
        "REFUNDED",
      ])
      .optional(),
    contractTradeId: z.coerce.number().int().nonnegative().optional(),
    createTxHash: txHashSchema.optional(),
    fundTxHash: txHashSchema.optional(),
    shippedTxHash: txHashSchema.optional(),
    completedTxHash: txHashSchema.optional(),
    disputeTxHash: txHashSchema.optional(),
    resolveTxHash: txHashSchema.optional(),
    trackingNumber: z.string().trim().max(120).optional(),
    disputeReason: z.string().trim().max(1000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
