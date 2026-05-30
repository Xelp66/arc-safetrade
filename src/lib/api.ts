import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 400);
  }

  return errorResponse("Unexpected server error", 500);
}
