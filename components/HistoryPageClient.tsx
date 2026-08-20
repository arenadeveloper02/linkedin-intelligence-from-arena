"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, Users } from 'lucide-react';
import type { DashboardData, HistoryEntry } from '@/lib/types';
import { parseWorkflowResponse } from '@/lib/parse';
import { extractIntelligencePayload } from '@/lib/search-parse';
import { parseHistoryRows } from '@/lib/history-parse';
import { decodeUnicodeEscapes, formatDate, formatNumber, initialsOf } from '@/lib/utils';
import Topbar from '@/components/Topbar';
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        let json: { success: boolean; error?: string; data?: unknown } = { success: false };
        try {
          json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
        } catch {
          json = { success: false };
        }
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.error ?? `History request failed with status ${res.status}.`);
          setEntries([]);
        } else {
          setEntries(parseHistoryRows(json.data));
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load history. Please try again.');
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const backToSearch = () => {
    const trimmed = email.trim();
    router.push(trimmed ? `/?emailId=${encodeURIComponent(trimmed)}` : '/');
  };

  const openEntry = (entry: HistoryEntry) => {
    const payload = extractIntelligencePayload(entry.payload);
    let parsed = parseWorkflowResponse(payload);
    if (!parsed.company && parsed.posts.length === 0 && parsed.people.length === 0) {
      parsed = parseWorkflowResponse(entry.payload);
    }
    setData(parsed);
  };

  return (
    <div className="min-h-screen bg-grey-50">
      <Topbar onBack={data ? () => setData(null) : backToSearch} />
      {data ? (
        <LinkedInIntelligenceDashboard data={data} />
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
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 text-sm font-semibold text-white">
                        {initialsOf(entry.title || '?')}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-grey-900">
                          {decodeUnicodeEscapes(entry.title) || 'Unknown'}
                        </p>
                        {entry.industry && (
                          <span className="inline-flex items-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                            {entry.industry}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 break-all text-xs text-grey-600">
                        {decodeUnicodeEscapes(entry.headline) || entry.subtitle || '—'}
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
                  <span className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 text-xs font-medium text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white">
                    Open Dashboard
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
