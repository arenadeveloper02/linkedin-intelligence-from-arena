"use client"

import { Clock, Loader2 } from 'lucide-react';
import type { HistoryEntry } from '@/lib/types';
import HistoryCard from '@/components/HistoryCard';

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
              <HistoryCard key={entry.id} entry={entry} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
