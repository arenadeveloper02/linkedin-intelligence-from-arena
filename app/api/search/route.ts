import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/970f3a69-e05e-4b68-b90c-4887a1e3cd2e/execute';
const WORKFLOW_API_KEY = 'sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let searchInput = '';
  let isCompany = 'true';
  try {
    const body = (await request.json()) as { searchInput?: unknown; isCompany?: unknown };
    searchInput = typeof body.searchInput === 'string' ? body.searchInput.trim() : '';
    isCompany = typeof body.isCompany === 'string' ? body.isCompany : 'true';
  } catch {
    searchInput = '';
  }

  if (!searchInput) {
    return NextResponse.json(
      { success: false, error: 'A search input is required.' },
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
      body: JSON.stringify({ searchInput, isCompany, stream: false }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Search service responded with status ${upstream.status}.` },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as unknown;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to reach the search service. Please try again.' },
      { status: 502 }
    );
  }
}
