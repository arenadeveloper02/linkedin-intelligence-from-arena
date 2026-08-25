"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Loader2, Users } from 'lucide-react';
import type { DashboardData, HistoryEntry, ProfileDetails, SearchResultItem } from '@/lib/types';
import { safeParseWorkflowResponse } from '@/lib/safe-parse';
import { parseHistoryRows } from '@/lib/history-parse';
import { extractIntelligencePayload } from '@/lib/search-parse';
import { findNewHistoryMatch, historyFingerprint, sleep } from '@/lib/history-match';
import { decodeUnicodeEscapes, extractProfileDetails, formatDate, formatNumber, initialsOf } from '@/lib/utils';
import {
  completeProfileDetails,
  extractAccountIdFromResponse,
  extractProfileDetailsFromResponse,
  extractProfileUrlFromResponse,
  resolveRefreshIdentifiers,
} from '@/lib/profile-details';
import Topbar from '@/components/Topbar';
import SearchScreen from '@/components/SearchScreen';
import AnalyzeLoading from '@/components/AnalyzeLoading';
import LinkedInIntelligenceDashboard from '@/components/LinkedInIntelligenceDashboard';

interface DashboardClientProps {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERSONAL_PROFILE_ERROR =
  'Unable to process personal profile intelligence at this time. Please select a Company profile or try again later.';

const ANALYSIS_TIMEOUT_ERROR =
  'Analysis is still running in the background. Open this profile from Recent Searches in a few minutes.';

const ANALYZE_POLL_MS = 5000;
const ANALYZE_WAIT_MS = 5 * 60 * 1000;

type ViewState = 'search' | 'loading' | 'dashboard';

export default function DashboardClient({ email }: DashboardClientProps) {
  const isValidEmail = EMAIL_REGEX.test(email.trim());
  const [view, setView] = useState<ViewState>('search');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Raw payload from the last successful Analyze/History load — final fallback
  // source for profile_url / account_id when building the Refresh payload.
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const lastPayloadRef = useRef<unknown>(null);
  const profileDetailsRef = useRef<ProfileDetails | null>(null);
  const analyzeGenRef = useRef(0);
  lastPayloadRef.current = lastPayload;
  profileDetailsRef.current = profileDetails;
  // Inline history state: rendered as "Recent Searches" directly beneath the search controls.
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Lightweight, silent history fetch (no loading-state churn). Used by the
  // timeout-recovery poller and by the background refresh after an analysis.
  const fetchHistoryEntries = useCallback(async (): Promise<HistoryEntry[] | null> => {
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        cache: 'no-store',
      });
      let json: { success: boolean; error?: string; data?: unknown } = { success: false };
      try {
        json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      } catch {
        json = { success: false };
      }
      if (!res.ok || !json.success) return null;
      return parseHistoryRows(json.data);
    } catch {
      return null;
    }
  }, [email]);

  // Full history load with visible loading/error states. Used on first paint only.
  // Analyze/Refresh update the list in the background via fetchHistoryEntries.
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        cache: 'no-store',
      });
      let json: { success: boolean; error?: string; data?: unknown } = { success: false };
      try {
        json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      } catch {
        json = { success: false };
      }
      if (!res.ok || !json.success) {
        setHistoryError(json.error ?? `History request failed with status ${res.status}.`);
        setHistoryEntries([]);
      } else {
        setHistoryEntries(parseHistoryRows(json.data));
      }
    } catch {
      setHistoryError('Unable to load history. Please try again.');
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Clicking a history card immediately loads that entry's stored dashboard payload.
  // profile_url is deep-extracted from the record payload (profile_details /
  // company_details / company_profile sections) so the "View Profile" CTA renders.
  const openEntry = async (entry: HistoryEntry) => {
    const entryProfileUrl = /^https?:\/\//i.test(entry.subtitle.trim()) ? entry.subtitle.trim() : '';
    const item: SearchResultItem = {
      id: entry.accountId || '',
      name: entry.title,
      headline: entry.headline,
      industry: entry.industry,
      location: entry.location,
      followersCount: entry.followersCount,
      avatarUrl: entry.logoUrl,
      profileUrl: entryProfileUrl,
      slug: entry.companySlug,
      verified: false,
      premium: false,
      isCompany: entry.isCompany,
    };
    setSelected(item);
    setError(null);
    setView('loading');
    setLastPayload(entry.payload);
    // Safe, non-blocking parse of the stored history payload (same optimized path
    // used for live analyze responses).
    const parsed = await safeParseWorkflowResponse(entry.payload);
    const deepDetails = extractProfileDetailsFromResponse(entry.payload);
    const payloadProfileUrl = extractProfileUrlFromResponse(entry.payload);
    const payloadAccountId = extractAccountIdFromResponse(entry.payload);
    const mergedDetails = completeProfileDetails({
      name: deepDetails?.name || entry.title,
      profileUrl: deepDetails?.profileUrl || payloadProfileUrl || entryProfileUrl,
      accountId: deepDetails?.accountId || payloadAccountId || entry.accountId || '',
      slug: deepDetails?.slug || entry.companySlug,
      logoUrl: deepDetails?.logoUrl || entry.logoUrl,
      tagline: deepDetails?.tagline || entry.headline,
      description: deepDetails?.description || '',
      industry: deepDetails?.industry || entry.industry,
      location: deepDetails?.location || entry.location,
      followersCount: deepDetails?.followersCount || entry.followersCount,
      isCompany: deepDetails?.isCompany ?? entry.isCompany,
    });
    setProfileDetails(mergedDetails);
    setSelected({
      ...item,
      profileUrl: mergedDetails.profileUrl || item.profileUrl,
      id: mergedDetails.accountId || item.id,
      slug: mergedDetails.slug || item.slug,
    });
    setData(parsed);
    setView('dashboard');
  };

  const waitForHistoryMatch = async (
    item: SearchResultItem,
    seen: Set<string>,
    isStale: () => boolean
  ): Promise<boolean> => {
    const target = {
      name: item.name,
      slug: item.slug,
      profileUrl: item.profileUrl,
      accountId: item.id,
    };
    const seed = await fetchHistoryEntries();
    if (seed) {
      setHistoryEntries(seed);
      for (const entry of seed) seen.add(historyFingerprint(entry));
    }
    const deadline = Date.now() + ANALYZE_WAIT_MS;
    while (Date.now() < deadline) {
      if (isStale()) return false;
      await sleep(ANALYZE_POLL_MS);
      if (isStale()) return false;
      const entries = await fetchHistoryEntries();
      if (!entries) continue;
      setHistoryEntries(entries);
      const match = findNewHistoryMatch(entries, target, seen);
      if (match) {
        await openEntry(match);
        return true;
      }
    }
    return false;
  };

  const analyze = async (item: SearchResultItem, isRefresh = false) => {
    const gen = (analyzeGenRef.current += 1);
    const isStale = () => analyzeGenRef.current !== gen;
    const seen = new Set(historyEntries.map(historyFingerprint));
    const hadDashboard = isRefresh && data !== null;
    setSelected(item);
    setError(null);
    setRefreshing(isRefresh);
    setView('loading');
    // On Refresh, take account_id / profile_url from the loaded profile_details
    // (company_profile.id + profile_url) and the stored response — never send blanks
    // when the selected dashboard already has them.
    const identifiers = isRefresh
      ? resolveRefreshIdentifiers({
          details: profileDetailsRef.current,
          profileUrl: item.profileUrl,
          accountId: item.id,
          slug: item.slug,
          payloads: [lastPayloadRef.current, extractIntelligencePayload(lastPayloadRef.current)],
        })
      : {
          profileUrl: item.profileUrl.trim() || profileDetails?.profileUrl?.trim() || '',
          accountId: item.id.trim() || profileDetails?.accountId?.trim() || '',
          slug: item.slug.trim() || profileDetails?.slug?.trim() || '',
        };
    const profileUrlToSend = identifiers.profileUrl;
    const accountIdToSend = identifiers.accountId;
    const slugToSend = identifiers.slug;
    let settled = false;
    const applyPayload = async (payload: unknown) => {
      if (settled || isStale()) return;
      settled = true;
      const parsed = await safeParseWorkflowResponse(payload);
      if (isStale()) return;
      const deepDetails = extractProfileDetailsFromResponse(payload);
      const baseDetails = extractProfileDetails(payload);
      const resolved = resolveRefreshIdentifiers({
        details: deepDetails || baseDetails,
        profileUrl: item.profileUrl,
        accountId: item.id,
        slug: item.slug,
        payloads: [payload, extractIntelligencePayload(payload), lastPayloadRef.current],
      });
      const mergedDetails = completeProfileDetails({
        name: deepDetails?.name || baseDetails?.name || item.name || profileDetails?.name || '',
        profileUrl: resolved.profileUrl || profileDetails?.profileUrl || '',
        accountId: resolved.accountId || profileDetails?.accountId || '',
        slug: resolved.slug || item.slug.trim() || profileDetails?.slug || '',
        logoUrl: deepDetails?.logoUrl || baseDetails?.logoUrl || item.avatarUrl || profileDetails?.logoUrl || '',
        tagline: deepDetails?.tagline || baseDetails?.tagline || item.headline || profileDetails?.tagline || '',
        description: deepDetails?.description || baseDetails?.description || profileDetails?.description || '',
        industry: deepDetails?.industry || baseDetails?.industry || item.industry || profileDetails?.industry || '',
        location: deepDetails?.location || baseDetails?.location || item.location || profileDetails?.location || '',
        followersCount:
          deepDetails?.followersCount ||
          baseDetails?.followersCount ||
          item.followersCount ||
          profileDetails?.followersCount ||
          0,
        isCompany: deepDetails?.isCompany ?? baseDetails?.isCompany ?? item.isCompany,
      });
      setProfileDetails(mergedDetails);
      setLastPayload(payload);
      setSelected({
        ...item,
        profileUrl: mergedDetails.profileUrl || item.profileUrl,
        id: mergedDetails.accountId || item.id,
        slug: mergedDetails.slug || item.slug,
      });
      setData(parsed);
      setView('dashboard');
      void fetchHistoryEntries().then((entries) => {
        if (entries) setHistoryEntries(entries);
      });
    };
    try {
      const kickoff = (async () => {
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              profile_url: profileUrlToSend,
              account_id: accountIdToSend,
              slug: slugToSend,
              email: email.trim(),
              is_company: item.isCompany ? 'true' : 'false',
              post_limit: 10,
            }),
          });
          let json: { success: boolean; pending?: boolean; error?: string; data?: unknown } = {
            success: false,
          };
          try {
            json = (await res.json()) as {
              success: boolean;
              pending?: boolean;
              error?: string;
              data?: unknown;
            };
          } catch {
            json = { success: false };
          }
          if (isStale() || settled) return;
          if (json.success && (json.pending || json.data === undefined)) return;
          if (res.ok && json.success && json.data !== undefined) {
            await applyPayload(json.data);
            return;
          }
          if (res.status === 504 || res.status === 502) return;
          settled = true;
          if (!item.isCompany) {
            setError(PERSONAL_PROFILE_ERROR);
          } else {
            setError(json.error ?? `Request failed with status ${res.status}.`);
          }
          setView(hadDashboard ? 'dashboard' : 'search');
        } catch {
          // Network / timeout: keep the loading screen and let history polling finish.
        }
      })();

      const poll = (async () => {
        const recovered = await waitForHistoryMatch(item, seen, () => isStale() || settled);
        if (recovered) settled = true;
      })();

      await Promise.all([kickoff, poll]);
      if (isStale() || settled) return;
      setError(ANALYSIS_TIMEOUT_ERROR);
      setView(hadDashboard ? 'dashboard' : 'search');
    } catch {
      if (isStale() || settled) return;
      const recovered = await waitForHistoryMatch(item, seen, () => isStale() || settled);
      if (recovered || isStale()) return;
      if (!item.isCompany) {
        setError(PERSONAL_PROFILE_ERROR);
      } else {
        setError('Unable to reach the intelligence service. Please try again.');
      }
      setView(hadDashboard ? 'dashboard' : 'search');
    } finally {
      if (analyzeGenRef.current === gen) setRefreshing(false);
    }
  };

  if (!isValidEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-grey-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-grey-200 bg-white p-8 text-center shadow-ds-lg">
          <h1 className="text-xl font-semibold text-grey-900">Access denied</h1>
          <p className="mt-2 text-sm text-grey-600">
            A valid <span className="font-medium">email</span> query parameter is required to view this dashboard.
          </p>
          <p className="mt-3 rounded-lg bg-grey-50 px-3 py-2 font-mono text-xs text-grey-700">?email=you@company.com</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <Topbar
        loading={view === 'loading' || refreshing}
        subtitle={view === 'dashboard' ? 'Signal tracking: people, companies & post engagement' : undefined}
        onBack={
          view === 'dashboard'
            ? () => {
                setView('search');
                setData(null);
              }
            : undefined
        }
        onRefresh={view === 'dashboard' && selected ? () => void analyze(selected, true) : undefined}
      />
      {error && view === 'dashboard' && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        </div>
      )}
      <div className={view === 'search' ? '' : 'hidden'}>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          {error && view === 'search' && (
            <div className="mb-4 rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}
          <SearchScreen onSelect={(item) => void analyze(item)} />

          <section className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-grey-900">Recent Searches</h2>
                <p className="text-sm text-grey-500">Select a past analysis to open its dashboard instantly</p>
              </div>
            </div>
            {historyLoading && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-grey-200 bg-white py-16 text-center shadow-ds-sm">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <p className="mt-3 text-sm text-grey-500">Loading your recent searches…</p>
              </div>
            )}
            {!historyLoading && historyError && (
              <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">
                {historyError}
              </div>
            )}
            {!historyLoading && !historyError && historyEntries.length === 0 && (
              <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
                No history found yet. Run an analysis to see it here.
              </div>
            )}
            {!historyLoading && !historyError && historyEntries.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {historyEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => void openEntry(entry)}
                    className="group flex flex-col rounded-xl border border-grey-200 bg-white p-5 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
                  >
                    <div className="flex items-start gap-3">
                      {entry.logoUrl ? (
                        <img
                          src={entry.logoUrl}
                          alt={entry.title}
                          className={`h-12 w-12 shrink-0 object-cover ${entry.isCompany ? 'rounded-lg' : 'rounded-full'}`}
                        />
                      ) : (
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand-600 to-purple-600 text-sm font-semibold text-white ${entry.isCompany ? 'rounded-lg' : 'rounded-full'}`}>
                          {initialsOf(entry.title || '?')}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-grey-900">
                            {decodeUnicodeEscapes(entry.title) || 'Unknown'}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              entry.isCompany ? 'bg-brand-50 text-brand-700' : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {entry.isCompany ? '🏢 Company' : '👤 Personal'}
                          </span>
                          {entry.companySlug && (
                            <span className="inline-flex items-center rounded-full bg-grey-50 px-1.5 py-0.5 text-[10px] font-medium text-grey-600">
                              {entry.companySlug}
                            </span>
                          )}
                          {entry.industry && (
                            <span className="inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                              {entry.industry}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-grey-600">
                          {decodeUnicodeEscapes(entry.headline) || '—'}
                        </p>
                      </div>
                    </div>
                    {entry.followersCount > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-grey-500">
                        <span className="flex shrink-0 items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatNumber(entry.followersCount)} followers
                        </span>
                      </div>
                    )}
                    {entry.timestamp && (
                      <span className="mt-2 flex items-center gap-1 text-[11px] text-grey-400">
                        <Clock className="h-3 w-3" />
                        Analyzed {formatDate(entry.timestamp) || entry.timestamp}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      {view === 'loading' && <AnalyzeLoading name={selected?.name} />}
      {view === 'dashboard' && data && (
        <LinkedInIntelligenceDashboard
          data={data}
          profileUrl={selected?.profileUrl ?? ''}
          profileDetails={profileDetails}
        />
      )}
    </div>
  );
}
