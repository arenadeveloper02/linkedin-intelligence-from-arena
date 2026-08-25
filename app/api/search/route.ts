import { NextResponse } from 'next/server';
import { safeJsonStringify, sanitizeDeep } from '@/lib/sanitize';
import { arenaAuthHeaders, arenaWorkflowError, getArenaApiKey } from '@/lib/arena-api';

export const dynamic = 'force-dynamic';

const SEARCH_WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/970f3a69-e05e-4b68-b90c-4887a1e3cd2e/execute';

/**
 * Proxies the LinkedIn entity search request to the search workflow.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!getArenaApiKey()) {
      return NextResponse.json(
        { success: false, error: 'Arena API key is not configured. Set ARENA_API_KEY in Vercel environment variables.' },
        { status: 500 }
      );
    }
    const res = await fetch(SEARCH_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...arenaAuthHeaders(),
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
        { success: false, error: arenaWorkflowError('Search workflow', res.status) },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, data: sanitizeDeep(data) });
  } catch {
    return NextResponse.json({ success: false, error: 'Search request failed.' }, { status: 500 });
  }
}
