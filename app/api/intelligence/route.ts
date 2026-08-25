import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const HISTORY_WORKFLOW_URL = process.env.HISTORY_WORKFLOW_URL ?? '';

/**
 * History endpoint — intentionally kept as a thin, low-latency passthrough:
 * no database writes, no payload re-serialization or deep transformations on
 * the server. The raw workflow response is returned as-is and all parsing
 * happens client-side (lib/history-parse.ts), so the initial history fetch
 * is as fast as a direct Postman request against the workflow.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }
    if (!HISTORY_WORKFLOW_URL) {
      return NextResponse.json(
        { success: false, error: 'History workflow is not configured (missing HISTORY_WORKFLOW_URL).' },
        { status: 500 }
      );
    }
    const apiKey = process.env.SIM_API_KEY ?? '';
    const res = await fetch(HISTORY_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({ email }),
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
        { success: false, error: `History workflow failed with status ${res.status}.` },
        { status: 502 }
      );
    }
    // Light caching hint: allow the browser to reuse the response briefly while
    // still revalidating, keeping the inline history section instant on render.
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'private, max-age=15, must-revalidate' } }
    );
  } catch {
    return NextResponse.json({ success: false, error: 'History request failed.' }, { status: 500 });
  }
}
