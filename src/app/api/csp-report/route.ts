import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Content-Security-Policy violation reporting endpoint.
 *
 * Browsers POST CSP violation reports here via the `report-uri` directive
 * configured on the site CSP in next.config.ts. The endpoint is intentionally
 * UNAUTHENTICATED / public — that is inherent to the CSP reporting spec: any
 * browser visiting the site may POST a report to it.
 *
 * Safety:
 * - Content-Type gated to the two types browsers use for CSP reports
 *   (application/csp-report, application/reports+json); anything else -> 415,
 *   which drops cross-site noise with no auth.
 * - Payload validated as a JSON object; malformed input -> 400.
 * - Payload length capped (see MAX_REPORT_BYTES) to guard against log
 *   flooding / log-bomb via oversized reports.
 * - 204 No Content keeps the browser reporting path cheap.
 *
 * Why: the deployed site CSP is otherwise SILENT in production (violations
 * appear only in browser devtools). With report-uri, violations become
 * observable in Vercel logs BEFORE we tighten script-src — de-risking the
 * removal of 'unsafe-inline' via a nonce strategy (issue #32). Extends the
 * additive CSP hardening shipped in #53 / PR #64.
 */
const REPORT_CONTENT_TYPES = ["application/csp-report", "application/reports+json"];
const MAX_REPORT_BYTES = 4096;

// Always run dynamically; never cache. Every violation report must reach the
// logs, and this route carries no cacheable state.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!REPORT_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
    return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // A CSP report is always a JSON object (a csp-report or a Reporting-API
  // body wrapper). Reject any other top-level shape.
  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Malformed report" }, { status: 400 });
  }

  // Truncate before logging so a malicious/oversized report cannot blow up
  // the log stream. We do NOT echo payload content back to the client.
  const raw = JSON.stringify(payload);
  const text =
    raw.length > MAX_REPORT_BYTES
      ? raw.slice(0, MAX_REPORT_BYTES) + "…<truncated>"
      : raw;

  // Vercel captures stdout to its log drain — this IS the store for this
  // endpoint. The eslint-disable is intentional: logging CSP reports is the
  // endpoint's purpose, not debug leftovers.
  // eslint-disable-next-line no-console
  console.log(`[csp-report] ${new Date().toISOString()} ${text}`);

  return new NextResponse(null, { status: 204 });
}
