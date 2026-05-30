import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export function getDb() {
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }

  return globalThis.prisma;
}
