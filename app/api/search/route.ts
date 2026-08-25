import { NextResponse } from 'next/server';
import { safeJsonStringify, sanitizeDeep } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SEARCH_WORKFLOW_URL = process.env.SEARCH_WORKFLOW_URL ?? '';

/**
 * Proxies the LinkedIn entity search request to the search workflow.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!SEARCH_WORKFLOW_URL) {
      return NextResponse.json(
        { success: false, error: 'Search workflow is not configured (missing SEARCH_WORKFLOW_URL).' },
        { status: 500 }
      );
    }
    const apiKey = process.env.ARENA_API_KEY ?? process.env.SIM_API_KEY ?? '';
    const res = await fetch(SEARCH_WORKFLOW_URL, {
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
      return NextResponse.json(
        { success: false, error: `Search workflow failed with status ${res.status}.` },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, data: sanitizeDeep(data) });
  } catch {
    return NextResponse.json({ success: false, error: 'Search request failed.' }, { status: 500 });
  }
}
