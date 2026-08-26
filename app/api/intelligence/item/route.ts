import { NextResponse } from 'next/server';
import { arenaAuthHeaders, arenaWorkflowError, getArenaApiKey } from '@/lib/arena-api';

export const dynamic = 'force-dynamic';

const HISTORY_ITEM_WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/adfedcc8-3e7b-4818-8375-58f4e80d3ebc/execute';

interface HistoryItemRequestBody {
  id?: unknown;
}

function toWorkflowId(value: unknown): number | string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return trimmed;
  }
  return null;
}

/**
 * Thin proxy: forwards `{ id }` to the history-by-id workflow and streams the
 * Arena body back as-is. Do not parse or re-stringify the payload — that is
 * what made card-open take minutes while Postman finished in seconds.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HistoryItemRequestBody = {};
  try {
    body = (await request.json()) as HistoryItemRequestBody;
  } catch {
    body = {};
  }
  const id = toWorkflowId(body.id);
  if (id === null) {
    return NextResponse.json({ success: false, error: 'History id is required.' }, { status: 400 });
  }
  if (!getArenaApiKey()) {
    return NextResponse.json(
      { success: false, error: 'Arena API key is not configured. Set ARENA_API_KEY in Vercel environment variables.' },
      { status: 500 }
    );
  }
  try {
    const upstream = await fetch(HISTORY_ITEM_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...arenaAuthHeaders(),
      },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: arenaWorkflowError('History item workflow', upstream.status) },
        { status: upstream.status }
      );
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load this analysis. Please try again.' },
      { status: 500 }
    );
  }
}
