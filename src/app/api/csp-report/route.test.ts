import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeReq(opts: {
  type?: string;
  body?: unknown;
  rawBody?: string;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.type) headers["content-type"] = opts.type;
  let b: BodyInit | undefined;
  if (opts.rawBody !== undefined) b = opts.rawBody;
  else if (opts.body !== undefined) b = JSON.stringify(opts.body);
  return new NextRequest("https://example.com/api/csp-report", {
    method: "POST",
    headers,
    body: b,
  });
}

describe("POST /api/csp-report", () => {
  it("returns 204 and logs a valid CSP report", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const report = { "csp-report": { "document-uri": "https://example.com/" } };
    const res = await POST(makeReq({ type: "application/csp-report", body: report }));
    expect(res.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const line = log.mock.calls[0]?.[0] as string;
    expect(line).toContain("[csp-report]");
    expect(line).toContain("csp-report");
    log.mockRestore();
  });

  it("rejects unsupported content types with 415", async () => {
    const res = await POST(makeReq({ type: "application/json", body: {} }));
    expect(res.status).toBe(415);
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await POST(
      makeReq({ type: "application/csp-report", rawBody: "not json" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects non-object payloads with 400", async () => {
    const res = await POST(
      makeReq({ type: "application/csp-report", body: "a string" }),
    );
    expect(res.status).toBe(400);
  });

  it("truncates oversized payloads so logs stay bounded", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const big = JSON.stringify({ pad: "x".repeat(10000) });
    const res = await POST(makeReq({ type: "application/csp-report", rawBody: big }));
    expect(res.status).toBe(204);
    const line = log.mock.calls[0]?.[0] as string;
    expect(line.length).toBeLessThan(6000);
    expect(line).not.toContain("x".repeat(5000));
    log.mockRestore();
  });
});
