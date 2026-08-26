"use client"

import { Clock } from 'lucide-react';
import type { HistoryEntry } from '@/lib/types';
import { decodeUnicodeEscapes, formatDate, initialsOf } from '@/lib/utils';

interface HistoryCardProps {
  entry: HistoryEntry;
  onSelect: (entry: HistoryEntry) => void;
}

export default function HistoryCard({ entry, onSelect }: HistoryCardProps) {
  const name = decodeUnicodeEscapes(entry.title) || 'Unknown';
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="group flex flex-col rounded-xl border border-grey-200 bg-white p-5 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
    >
      <div className="flex items-start gap-3">
        {entry.logoUrl ? (
          <img
            src={entry.logoUrl}
            alt=""
            className={`h-12 w-12 shrink-0 object-cover ${entry.isCompany ? 'rounded-lg' : 'rounded-full'}`}
          />
        ) : (
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand-600 to-purple-600 text-sm font-semibold text-white ${
              entry.isCompany ? 'rounded-lg' : 'rounded-full'
            }`}
          >
            {initialsOf(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-grey-900">{name}</p>
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
          </div>
        </div>
      </div>
      {entry.timestamp && (
        <span className="mt-2 flex items-center gap-1 text-[11px] text-grey-400">
          <Clock className="h-3 w-3" />
          Analyzed {formatDate(entry.timestamp) || entry.timestamp}
        </span>
      )}
    </button>
  );
}
