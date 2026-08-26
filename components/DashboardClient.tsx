"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import type { DashboardData, HistoryEntry, ProfileDetails, SearchResultItem } from '@/lib/types';
import { safeParseWorkflowResponse } from '@/lib/safe-parse';
import {
  detailsFromHistoryPayload,
  parseHistoryRows,
  toHistoryWorkflowId,
  unwrapHistoryItemResponse,
} from '@/lib/history-parse';
import { extractIntelligencePayload } from '@/lib/search-parse';
import { extractProfileDetails } from '@/lib/utils';
import {
  completeProfileDetails,
  extractProfileDetailsFromResponse,
  resolveRefreshIdentifiers,
} from '@/lib/profile-details';
import Topbar from '@/components/Topbar';
import SearchScreen from '@/components/SearchScreen';
import AnalyzeLoading from '@/components/AnalyzeLoading';
import HistoryCard from '@/components/HistoryCard';
import LinkedInIntelligenceDashboard from '@/components/LinkedInIntelligenceDashboard';

interface DashboardClientProps {
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERSONAL_PROFILE_ERROR =
  'Unable to process personal profile intelligence at this time. Please select a Company profile or try again later.';

const ANALYSIS_TIMEOUT_ERROR =
  'Analysis is still running in the background. Open this profile from Recent Searches in a few minutes.';

type ViewState = 'search' | 'loading' | 'dashboard';

export default function DashboardClient({ email }: DashboardClientProps) {
  const isValidEmail = EMAIL_REGEX.test(email.trim());
  const [view, setView] = useState<ViewState>('search');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMode, setLoadingMode] = useState<'analyze' | 'history'>('analyze');
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

  // Silent history fetch used after Analyze/Refresh completes.
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
    setLoadingMode('history');
    setView('loading');
    try {
      const res = await fetch('/api/intelligence/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: toHistoryWorkflowId(entry.id) }),
        cache: 'no-store',
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      const payload = unwrapHistoryItemResponse(json);
      const payloadRecord =
        payload && typeof payload === 'object' ? (payload as { success?: boolean; error?: string }) : null;
      if (!res.ok || payload == null || payloadRecord?.success === false) {
        setError(payloadRecord?.error ?? 'Unable to load this analysis. Please try again.');
        setView('search');
        return;
      }
      const parsed = await safeParseWorkflowResponse(payload);
      const mergedDetails = detailsFromHistoryPayload(payload, entry);
      setLastPayload(payload);
      setProfileDetails(mergedDetails);
      setSelected({
        ...item,
        profileUrl: mergedDetails.profileUrl || item.profileUrl,
        id: mergedDetails.accountId || item.id,
        slug: mergedDetails.slug || item.slug,
        avatarUrl: mergedDetails.logoUrl || item.avatarUrl,
      });
      setData(parsed);
      setView('dashboard');
    } catch {
      setError('Unable to load this analysis. Please try again.');
      setView('search');
    }
  };

  const refreshHistory = async () => {
    const entries = await fetchHistoryEntries();
    if (entries) setHistoryEntries(entries);
  };

  const analyze = async (item: SearchResultItem, isRefresh = false) => {
    const gen = (analyzeGenRef.current += 1);
    const isStale = () => analyzeGenRef.current !== gen;
    const hadDashboard = isRefresh && data !== null;
    setSelected(item);
    setError(null);
    setRefreshing(isRefresh);
    setLoadingMode('analyze');
    setView('loading');
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
      let json: { success: boolean; error?: string; data?: unknown } = { success: false };
      try {
        json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      } catch {
        json = { success: false };
      }
      if (isStale()) return;
      if (res.ok && json.success && json.data !== undefined) {
        const parsed = await safeParseWorkflowResponse(json.data);
        if (isStale()) return;
        const deepDetails = extractProfileDetailsFromResponse(json.data);
        const baseDetails = extractProfileDetails(json.data);
        const mergedDetails = completeProfileDetails({
          name: deepDetails?.name || baseDetails?.name || item.name,
          profileUrl: deepDetails?.profileUrl || baseDetails?.profileUrl || item.profileUrl,
          accountId: deepDetails?.accountId || baseDetails?.accountId || item.id,
          slug: deepDetails?.slug || baseDetails?.slug || item.slug.trim(),
          logoUrl: deepDetails?.logoUrl || baseDetails?.logoUrl || item.avatarUrl,
          tagline: deepDetails?.tagline || baseDetails?.tagline || item.headline,
          description: deepDetails?.description || baseDetails?.description || '',
          industry: deepDetails?.industry || baseDetails?.industry || item.industry,
          location: deepDetails?.location || baseDetails?.location || item.location,
          followersCount:
            deepDetails?.followersCount || baseDetails?.followersCount || item.followersCount || 0,
          isCompany: deepDetails?.isCompany ?? baseDetails?.isCompany ?? item.isCompany,
        });
        setProfileDetails(mergedDetails);
        setLastPayload(json.data);
        setSelected({
          ...item,
          profileUrl: mergedDetails.profileUrl || item.profileUrl,
          id: mergedDetails.accountId || item.id,
          slug: mergedDetails.slug || item.slug,
          avatarUrl: mergedDetails.logoUrl || item.avatarUrl,
        });
        setData(parsed);
        setView('dashboard');
      } else {
        if (res.status === 504 || res.status === 502) {
          setError(ANALYSIS_TIMEOUT_ERROR);
        } else if (!item.isCompany) {
          setError(PERSONAL_PROFILE_ERROR);
        } else {
          setError(json.error ?? `Request failed with status ${res.status}.`);
        }
        setView(hadDashboard ? 'dashboard' : 'search');
      }
      if (!isStale()) await refreshHistory();
    } catch {
      if (isStale()) return;
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
                  <HistoryCard key={entry.id} entry={entry} onSelect={(item) => void openEntry(item)} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      {view === 'loading' && <AnalyzeLoading name={selected?.name} variant={loadingMode} />}
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
