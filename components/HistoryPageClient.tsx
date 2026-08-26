"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2 } from 'lucide-react';
import type { DashboardData, HistoryEntry, ProfileDetails } from '@/lib/types';
import { extractIntelligencePayload } from '@/lib/search-parse';
import {
  detailsFromHistoryPayload,
  parseHistoryRows,
  toHistoryWorkflowId,
  unwrapHistoryItemResponse,
} from '@/lib/history-parse';
import { safeParseWorkflowResponse } from '@/lib/safe-parse';
import {
  completeProfileDetails,
  extractProfileDetailsFromResponse,
  resolveRefreshIdentifiers,
} from '@/lib/profile-details';
import Topbar from '@/components/Topbar';
import AnalyzeLoading from '@/components/AnalyzeLoading';
import HistoryCard from '@/components/HistoryCard';
import LinkedInIntelligenceDashboard from '@/components/LinkedInIntelligenceDashboard';

interface HistoryPageClientProps {
  email: string;
}

export default function HistoryPageClient({ email }: HistoryPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  // Canonical profile identifiers (profile_url / account_id / slug) captured from
  // the opened history payload so the "View Profile" CTA renders and Refresh
  // never sends empty identifier fields.
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState(false);

  // History load extracted into a callback so it can be re-triggered after
  // Analyze/Refresh. Opening a card and going back reuses the cached list.
  const loadHistory = useCallback(async (opts?: { silent?: boolean }): Promise<HistoryEntry[] | null> => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
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
        if (!silent) {
          setError(json.error ?? `History request failed with status ${res.status}.`);
          setEntries([]);
        }
        return null;
      }
      const parsed = parseHistoryRows(json.data);
      setEntries(parsed);
      return parsed;
    } catch {
      if (!silent) {
        setError('Unable to load history. Please try again.');
        setEntries([]);
      }
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const backToSearch = () => {
    const trimmed = email.trim();
    router.push(trimmed ? `/?emailId=${encodeURIComponent(trimmed)}` : '/');
  };

  const openEntry = async (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setOpening(true);
    setError(null);
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
        setSelectedEntry(null);
        return;
      }
      const parsed = await safeParseWorkflowResponse(payload);
      setLastPayload(payload);
      setProfileDetails(detailsFromHistoryPayload(payload, entry));
      setData(parsed);
    } catch {
      setError('Unable to load this analysis. Please try again.');
      setSelectedEntry(null);
    } finally {
      setOpening(false);
    }
  };

  const refresh = async () => {
    if (!selectedEntry || refreshing) return;
    setRefreshing(true);
    try {
      const entryProfileUrl = /^https?:\/\//i.test(selectedEntry.subtitle.trim())
        ? selectedEntry.subtitle.trim()
        : '';
      const identifiers = resolveRefreshIdentifiers({
        details: profileDetails,
        profileUrl: entryProfileUrl,
        accountId: selectedEntry.accountId,
        slug: selectedEntry.companySlug,
        payloads: [lastPayload, extractIntelligencePayload(lastPayload)],
      });
      const profileUrlToSend = identifiers.profileUrl;
      const accountIdToSend = identifiers.accountId;
      const slugToSend = identifiers.slug;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedEntry.title,
          profile_url: profileUrlToSend,
          account_id: accountIdToSend,
          slug: slugToSend,
          email: email.trim(),
          is_company: selectedEntry.isCompany ? 'true' : 'false',
          post_limit: 10,
        }),
      });
      let json: { success: boolean; error?: string; data?: unknown } = { success: false };
      try {
        json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      } catch {
        json = { success: false };
      }
      if (res.ok && json.success && json.data !== undefined) {
        const parsed = await safeParseWorkflowResponse(json.data);
        const deepDetails = extractProfileDetailsFromResponse(json.data);
        setLastPayload(json.data);
        setProfileDetails(
          completeProfileDetails({
            name: deepDetails?.name || selectedEntry.title,
            profileUrl: deepDetails?.profileUrl || profileUrlToSend,
            accountId: deepDetails?.accountId || accountIdToSend,
            slug: deepDetails?.slug || slugToSend,
            logoUrl: deepDetails?.logoUrl || '',
            tagline: deepDetails?.tagline || '',
            description: deepDetails?.description || '',
            industry: deepDetails?.industry || '',
            location: deepDetails?.location || '',
            followersCount: deepDetails?.followersCount || 0,
            isCompany: deepDetails?.isCompany ?? selectedEntry.isCompany,
          })
        );
        setData(parsed);
      }
      void loadHistory({ silent: true });
    } catch {
      // Keep the currently loaded dashboard data if the refresh fails.
    } finally {
      setRefreshing(false);
    }
  };

  const selectedProfileUrl =
    profileDetails?.profileUrl?.trim() ||
    (selectedEntry && /^https?:\/\//i.test(selectedEntry.subtitle.trim()) ? selectedEntry.subtitle.trim() : '');

  return (
    <div className="min-h-screen bg-grey-50">
      <Topbar
        loading={refreshing || opening}
        subtitle={data ? 'Signal tracking: people, companies & post engagement' : undefined}
        onBack={
          refreshing || opening
            ? undefined
            : data
              ? () => {
                  setData(null);
                  setSelectedEntry(null);
                  setProfileDetails(null);
                  setLastPayload(null);
                }
              : backToSearch
        }
        onRefresh={!refreshing && !opening && data && selectedEntry ? () => void refresh() : undefined}
      />
      {opening || refreshing ? (
        <AnalyzeLoading
          name={selectedEntry?.title}
          variant={opening ? 'history' : 'analyze'}
        />
      ) : data ? (
        <LinkedInIntelligenceDashboard data={data} profileUrl={selectedProfileUrl} profileDetails={profileDetails} />
      ) : (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-grey-900">Analysis history</h2>
              <p className="text-sm text-grey-500">Select a past analysis to open its dashboard view</p>
            </div>
          </div>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-brand-600" />
              <p className="mt-3 text-sm text-grey-500">Loading your history…</p>
            </div>
          )}
          {!loading && error && (
            <div className="mb-4 rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
          )}
          {!loading && entries.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
              No history found yet. Run an analysis to see it here.
            </div>
          )}
          {!loading && entries.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} onSelect={(item) => void openEntry(item)} />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
