import { NextRequest, NextResponse } from 'next/server';
import { recordFetchLog } from '@/lib/actions';
import { safeJsonStringify, stripUnpairedSurrogateEscapes } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const WORKFLOW_URL =
  'https://agent.thearena.ai/api/workflows/3909ec63-faf0-4d69-abd1-499bc7b158d0/execute';
const WORKFLOW_API_KEY = 'sk-sim-g6HxaMjNLmbQ-iqVeQnYIK3nuiyogqPs';

// Abort the upstream workflow call before Vercel terminates the function invocation
// (maxDuration = 60s) so we can return a graceful 504 instead of FUNCTION_INVOCATION_TIMEOUT.
const UPSTREAM_TIMEOUT_MS = 55000;

const TIMEOUT_ERROR_MESSAGE =
  'Analysis is taking longer than expected. Please try refreshing in a few moments or try again.';

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
      { success: false, error: 'A valid email is required to run the analysis.' },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': WORKFLOW_API_KEY,
        'Content-Type': 'application/json',
      },
      // safeJsonStringify guarantees the payload contains no unpaired UTF-16
      // surrogate escapes (LinkedIn emoji frequently arrive truncated), which
      // strict upstream JSON parsers would otherwise reject.
      body: safeJsonStringify({
        name,
        profile_url: profileUrl,
        account_id: accountId,
        slug,
        email,
        is_company: isCompany,
        stream: false,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!upstream.ok) {
      await recordFetchLog(email, `analyze-error:${upstream.status}`);
      return NextResponse.json(
        { success: false, error: `Analysis service responded with status ${upstream.status}.` },
        { status: 502 }
      );
    }

    // Read the (potentially very large) analyze payload as text and clean any
    // unpaired surrogate escape sequences BEFORE parsing so double-encoded
    // strings inside users_profile_data.values / engagementRecords never throw
    // during JSON.parse. Falling back to the raw text keeps the response usable
    // even when the upstream body is not strict JSON — the client-side
    // safeParseWorkflowResponse handles both shapes without runtime errors.
    const rawText = await upstream.text();
    let data: unknown = null;
    try {
      data = JSON.parse(stripUnpairedSurrogateEscapes(rawText));
    } catch {
      data = rawText;
    }

    await recordFetchLog(email, 'analyze-success');
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    try {
      await recordFetchLog(email, aborted ? 'analyze-timeout' : 'analyze-error:network');
    } catch {
      // Logging must never mask the client-facing error response.
    }
    if (aborted) {
      return NextResponse.json({ success: false, error: TIMEOUT_ERROR_MESSAGE }, { status: 504 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to reach the analysis service. Please try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
