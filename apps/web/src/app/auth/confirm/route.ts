/** `/auth/confirm`: opens the session from the email link (token_hash), then redirects. */
import type { NextRequest, NextResponse } from "next/server";
import { handleConfirm } from "@/shared/auth/route-handlers";

/**
 * GET handler of the email link.
 *
 * @param request - The incoming request.
 * @returns A redirect.
 */
export function GET(request: NextRequest): Promise<NextResponse> {
  return handleConfirm(request);
}
