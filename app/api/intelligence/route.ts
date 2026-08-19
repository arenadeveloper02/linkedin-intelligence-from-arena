import { NextRequest, NextResponse } from 'next/server';
import { recordFetchLog } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/9a27db23-9366-416b-b0c8-9c65e7eda202/execute';
const WORKFLOW_API_KEY = 'sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let email = '';
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim() : '';
  } catch {
    email = '';
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, error: 'A valid email query parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': WORKFLOW_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, stream: false }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      await recordFetchLog(email, `error:${upstream.status}`);
      return NextResponse.json(
        { success: false, error: `Intelligence service responded with status ${upstream.status}.` },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as unknown;
    await recordFetchLog(email, 'success');
    return NextResponse.json({ success: true, data });
  } catch {
    await recordFetchLog(email, 'error:network');
    return NextResponse.json(
      { success: false, error: 'Failed to reach the intelligence service. Please try again.' },
      { status: 502 }
    );
  }
}
