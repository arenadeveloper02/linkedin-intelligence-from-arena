import { NextResponse } from 'next/server';
import { recordFetchLog } from '@/lib/actions';

// Increase the serverless execution window so long-running analyze workflow
// executions complete instead of failing with a premature Vercel timeout.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANALYZE_WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute';

interface AnalyzeRequestBody {
  name?: string;
  profile_url?: string;
  account_id?: string;
  slug?: string;
  email?: string;
  is_company?: string;
}

/**
 * Analyze proxy: forwards the exact payload structure required by the analyze
 * workflow — name, profile_url, account_id, slug, email, is_company, post_limit —
 * without stripping or emptying identifier fields supplied by the client.
 * `post_limit` always defaults to 10.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: AnalyzeRequestBody = {};
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    body = {};
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const profileUrl = typeof body.profile_url === 'string' ? body.profile_url.trim() : '';
  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const isCompany = body.is_company === 'true' ? 'true' : 'false';
  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
  }
  if (!name && !profileUrl && !accountId && !slug) {
    return NextResponse.json(
      { success: false, error: 'A profile identifier (name, profile_url, account_id or slug) is required.' },
      { status: 400 }
    );
  }
  try {
    const apiKey = process.env.ARENA_API_KEY ?? '';
    const upstream = await fetch(ANALYZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({
        name,
        profile_url: profileUrl,
        account_id: accountId,
        slug,
        email,
        is_company: isCompany,
        post_limit: 10,
      }),
      cache: 'no-store',
    });
    const text = await upstream.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      // Keep raw text; the client-side safe parser deep-decodes string payloads.
    }
    void recordFetchLog(email, upstream.ok ? 'success' : `error_${upstream.status}`);
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Analyze workflow failed with status ${upstream.status}.` },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch {
    void recordFetchLog(email, 'error_network');
    return NextResponse.json(
      { success: false, error: 'Unable to reach the analyze service. Please try again.' },
      { status: 500 }
    );
  }
}
