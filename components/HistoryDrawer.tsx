"use client"

import { Clock, Loader2, X } from 'lucide-react';
import type { HistoryEntry } from '@/lib/types';
import { initialsOf } from '@/lib/utils';

interface HistoryDrawerProps {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
}

export default function HistoryDrawer({ entries, loading, error, onClose, onSelect }: HistoryDrawerProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-grey-900/70" onClick={onClose} aria-hidden="true" />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-ds-xl">
        <header className="flex items-center justify-between border-b border-grey-200 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-grey-900">Analysis history</h2>
              <p className="text-xs text-grey-500">Select a past analysis to reload its dashboard</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-grey-500 hover:bg-grey-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-grey-200 bg-white p-4 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 text-xs font-semibold text-white">
                      {initialsOf(entry.title || '?')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-grey-900">{entry.title}</span>
                      {entry.subtitle && (
                        <span className="mt-0.5 block truncate text-xs text-grey-500">{entry.subtitle}</span>
                      )}
                      {entry.timestamp && (
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-grey-400">
                          <Clock className="h-3 w-3" />
                          {entry.timestamp}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 self-center rounded-lg border border-brand-600 px-3 py-1 text-[11px] font-medium text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                      Open
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
