/** `/auth/callback`: Google sends the browser back here with a code; it becomes the session cookie. */
import type { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/shared/auth/route-handlers";

/**
 * GET handler of the OAuth return.
 *
 * @param request - The incoming request.
 * @returns A redirect.
 */
export function GET(request: NextRequest): Promise<NextResponse> {
  return handleCallback(request);
}
