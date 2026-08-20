"use client"

import { Clock, Loader2, MapPin, Users } from 'lucide-react';
import type { HistoryEntry } from '@/lib/types';
import { decodeUnicodeEscapes, formatDate, formatNumber, initialsOf } from '@/lib/utils';

interface HistoryViewProps {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export default function HistoryView({ entries, loading, error, onSelect }: HistoryViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-grey-200 bg-white p-6 shadow-ds-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-grey-900">Analysis history</h2>
            <p className="mt-0.5 text-sm text-grey-500">
              Select a past analysis to reload its full dashboard — Overview, People, Companies and Posts.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-grey-200 bg-white py-20 text-center shadow-ds-sm">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
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
        <div>
          <p className="mb-3 text-xs font-medium text-grey-500">
            {entries.length} past analys{entries.length === 1 ? 'is' : 'es'} — click a card to open its dashboard
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry)}
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
                    <p className="mt-0.5 line-clamp-2 text-xs text-grey-600">
                      {decodeUnicodeEscapes(entry.headline) || entry.subtitle || '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-grey-500">
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{entry.location || '—'}</span>
                  </span>
                  {entry.followersCount > 0 && (
                    <span className="flex shrink-0 items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {formatNumber(entry.followersCount)} followers
                    </span>
                  )}
                </div>
                {entry.timestamp && (
                  <span className="mt-2 flex items-center gap-1 text-[11px] text-grey-400">
                    <Clock className="h-3 w-3" />
                    Analyzed {formatDate(entry.timestamp) || entry.timestamp}
                  </span>
                )}
                <span className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 text-xs font-medium text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white">
                  Open Analysis
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
