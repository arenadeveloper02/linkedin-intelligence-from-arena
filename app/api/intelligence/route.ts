import { NextResponse } from 'next/server';

// Match the Vercel function limit so long-running history workflow executions
// are not cut off before the upstream responds.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const HISTORY_WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute';

interface HistoryRequestBody {
  email?: string;
}

/**
 * Optimized history proxy: forwards `{ email }` directly to the Arena history
 * workflow with zero server-side payload transformation or blocking logic.
 * The raw workflow response body is streamed back to the client as-is inside
 * the `data` field so all parsing happens client-side (lib/history-parse.ts).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: HistoryRequestBody = {};
  try {
    body = (await request.json()) as HistoryRequestBody;
  } catch {
    body = {};
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
  }
  try {
    const apiKey = process.env.ARENA_API_KEY ?? '';
    const upstream = await fetch(HISTORY_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    const text = await upstream.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      // Keep the raw text payload; the client-side parser deep-decodes strings.
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `History workflow failed with status ${upstream.status}.` },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load history. Please try again.' },
      { status: 500 }
    );
  }
}
