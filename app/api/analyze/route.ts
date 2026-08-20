import { NextRequest, NextResponse } from 'next/server';
import { recordFetchLog } from '@/lib/actions';

export const dynamic = 'force-dynamic';

const WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute';
const WORKFLOW_API_KEY = 'sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest): Promise<NextResponse> {
  let name = '';
  let profileUrl = '';
  let accountId = '';
  let slug = '';
  let email = '';
  let isCompany = 'true';
  try {
    const body = (await request.json()) as {
      name?: unknown;
      profile_url?: unknown;
      account_id?: unknown;
      slug?: unknown;
      email?: unknown;
      is_company?: unknown;
    };
    name = typeof body.name === 'string' ? body.name.trim() : '';
    profileUrl = typeof body.profile_url === 'string' ? body.profile_url.trim() : '';
    accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
    slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    email = typeof body.email === 'string' ? body.email.trim() : '';
    isCompany =
      typeof body.is_company === 'string' && body.is_company.trim().toLowerCase() === 'false'
        ? 'false'
        : 'true';
  } catch {
    name = '';
  }

  if (!name && !profileUrl) {
    return NextResponse.json(
      { success: false, error: 'A selected entity name or profile URL is required.' },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { success: false, error: 'A valid email is required.' },
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
      body: JSON.stringify({
        name,
        profile_url: profileUrl,
        account_id: accountId,
        slug,
        email,
        is_company: isCompany,
      }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      await recordFetchLog(email, `analyze-error:${upstream.status}`);
      return NextResponse.json(
        { success: false, error: `Intelligence service responded with status ${upstream.status}.` },
        { status: 502 }
      );
    }

    let data: unknown = null;
    try {
      data = (await upstream.json()) as unknown;
    } catch {
      await recordFetchLog(email, 'analyze-error:invalid-json');
      return NextResponse.json(
        { success: false, error: 'Intelligence service returned an invalid response. Please try again.' },
        { status: 502 }
      );
    }
    await recordFetchLog(email, 'analyze-success');
    return NextResponse.json({ success: true, data });
  } catch {
    await recordFetchLog(email, 'analyze-error:network');
    return NextResponse.json(
      { success: false, error: 'Failed to reach the intelligence service. Please try again.' },
      { status: 502 }
    );
  }
}
