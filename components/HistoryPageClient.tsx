"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, Users } from 'lucide-react';
import type { DashboardData, HistoryEntry, ProfileDetails } from '@/lib/types';
import { parseWorkflowResponse } from '@/lib/parse';
import { extractIntelligencePayload } from '@/lib/search-parse';
import { parseHistoryRows } from '@/lib/history-parse';
import { findNewHistoryMatch, historyFingerprint, sleep } from '@/lib/history-match';
import {
  completeProfileDetails,
  extractAccountIdFromResponse,
  extractProfileDetailsFromResponse,
  extractProfileUrlFromResponse,
  resolveRefreshIdentifiers,
} from '@/lib/profile-details';
import { decodeUnicodeEscapes, formatDate, formatNumber, initialsOf } from '@/lib/utils';
import Topbar from '@/components/Topbar';
import AnalyzeLoading from '@/components/AnalyzeLoading';
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
  const [refreshing, setRefreshing] = useState(false);

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

  const openEntry = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    const payload = extractIntelligencePayload(entry.payload);
    let parsed = parseWorkflowResponse(payload);
    if (!parsed.company && parsed.posts.length === 0 && parsed.people.length === 0) {
      parsed = parseWorkflowResponse(entry.payload);
    }
    // Restore the "View Profile" CTA: deep-extract profile_url / account_id from
    // the stored history payload (company_details.profile_url,
    // output.company_profile.profile_url, profile_details, etc.) and keep them
    // in active dashboard state.
    const entryProfileUrl = /^https?:\/\//i.test(entry.subtitle.trim()) ? entry.subtitle.trim() : '';
    const deepDetails = extractProfileDetailsFromResponse(entry.payload);
    const payloadProfileUrl = extractProfileUrlFromResponse(entry.payload);
    const payloadAccountId = extractAccountIdFromResponse(entry.payload);
    setProfileDetails(
      completeProfileDetails({
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
      })
    );
    setData(parsed);
  };

  const refresh = async () => {
    if (!selectedEntry || refreshing) return;
    setRefreshing(true);
    const seen = new Set(entries.map(historyFingerprint));
    const target = {
      name: selectedEntry.title,
      slug: selectedEntry.companySlug,
      profileUrl: /^https?:\/\//i.test(selectedEntry.subtitle.trim()) ? selectedEntry.subtitle.trim() : '',
      accountId: selectedEntry.accountId,
    };
    try {
      const identifiers = resolveRefreshIdentifiers({
        details: profileDetails,
        profileUrl: target.profileUrl,
        accountId: selectedEntry.accountId,
        slug: selectedEntry.companySlug,
        payloads: [selectedEntry.payload, extractIntelligencePayload(selectedEntry.payload)],
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
      let json: { success: boolean; pending?: boolean; error?: string; data?: unknown } = { success: false };
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
      if (res.ok && json.success && json.data !== undefined && !json.pending) {
        const payload = extractIntelligencePayload(json.data);
        let parsed = parseWorkflowResponse(payload);
        if (!parsed.company && parsed.posts.length === 0 && parsed.people.length === 0) {
          parsed = parseWorkflowResponse(json.data);
        }
        const deepDetails = extractProfileDetailsFromResponse(json.data);
        const resolved = resolveRefreshIdentifiers({
          details: deepDetails,
          profileUrl: profileUrlToSend,
          accountId: accountIdToSend,
          slug: slugToSend,
          payloads: [json.data, payload],
        });
        setProfileDetails((prev) =>
          completeProfileDetails({
            name: deepDetails?.name || prev?.name || selectedEntry.title,
            profileUrl: resolved.profileUrl || prev?.profileUrl || profileUrlToSend,
            accountId: resolved.accountId || prev?.accountId || accountIdToSend,
            slug: resolved.slug || prev?.slug || slugToSend,
            logoUrl: deepDetails?.logoUrl || prev?.logoUrl || selectedEntry.logoUrl,
            tagline: deepDetails?.tagline || prev?.tagline || selectedEntry.headline,
            description: deepDetails?.description || prev?.description || '',
            industry: deepDetails?.industry || prev?.industry || selectedEntry.industry,
            location: deepDetails?.location || prev?.location || selectedEntry.location,
            followersCount: deepDetails?.followersCount || prev?.followersCount || selectedEntry.followersCount,
            isCompany: deepDetails?.isCompany ?? prev?.isCompany ?? selectedEntry.isCompany,
          })
        );
        setData(parsed);
        void loadHistory({ silent: true });
        return;
      }
      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await sleep(5000);
        const latest = await loadHistory({ silent: true });
        if (!latest) continue;
        const match = findNewHistoryMatch(latest, target, seen);
        if (match) {
          openEntry(match);
          return;
        }
      }
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
        loading={refreshing}
        subtitle={data ? 'Signal tracking: people, companies & post engagement' : undefined}
        onBack={
          refreshing
            ? undefined
            : data
              ? () => {
                  setData(null);
                  setSelectedEntry(null);
                  setProfileDetails(null);
                }
              : backToSearch
        }
        onRefresh={!refreshing && data && selectedEntry ? () => void refresh() : undefined}
      />
      {refreshing ? (
        <AnalyzeLoading name={selectedEntry?.title} />
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
            <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
              No history found yet. Run an analysis to see it here.
            </div>
          )}
          {!loading && !error && entries.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openEntry(entry)}
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
        </main>
      )}
    </div>
  );
}
