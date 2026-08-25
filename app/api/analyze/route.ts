import { NextResponse } from 'next/server';
import { safeJsonStringify, sanitizeDeep } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
// Raised serverless execution limit so long-running analyze workflows do not get
// killed by the platform default. The frontend still gracefully recovers from a
// 504 by polling the history endpoint for the newly generated record.
export const maxDuration = 60;

const ANALYZE_WORKFLOW_URL =
  process.env.ANALYZE_WORKFLOW_URL ?? 'https://sim.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute';

/**
 * Proxies the Analyze request to the analyze workflow. The payload contains:
 * { name, profile_url, account_id, slug, email, is_company } — the client
 * guarantees profile_url / account_id are never empty when known.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey = process.env.SIM_API_KEY ?? '';
    const res = await fetch(ANALYZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: safeJsonStringify(body),
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      const status = res.status === 504 ? 504 : 502;
      return NextResponse.json(
        { success: false, error: `Analyze workflow failed with status ${res.status}.` },
        { status }
      );
    }
    return NextResponse.json({ success: true, data: sanitizeDeep(data) });
  } catch {
    return NextResponse.json({ success: false, error: 'Analyze request failed.' }, { status: 500 });
  }
}
