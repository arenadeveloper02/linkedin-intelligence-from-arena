"use client"

import { useState, type FormEvent } from 'react';
import { BadgeCheck, Crown, Loader2, MapPin, Search, Users } from 'lucide-react';
import type { SearchResultItem } from '@/lib/types';
import { parseSearchResults } from '@/lib/search-parse';
import { formatNumber, initialsOf } from '@/lib/utils';

interface SearchScreenProps {
  onSelect: (item: SearchResultItem) => void;
}

export default function SearchScreen({ onSelect }: SearchScreenProps) {
  const [isCompany, setIsCompany] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchInput: trimmed, isCompany: isCompany ? 'true' : 'false' }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: unknown };
      if (!res.ok || !json.success) {
        setError(json.error ?? `Search failed with status ${res.status}.`);
        setResults(null);
      } else {
        setResults(parseSearchResults(json.data, isCompany));
      }
    } catch {
      setError('Unable to reach the search service. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-grey-200 bg-white p-6 shadow-ds-sm">
        <h2 className="text-lg font-semibold text-grey-900">Search LinkedIn</h2>
        <p className="mt-1 text-sm text-grey-500">
          Find a person or company, then select a result to generate its engagement intelligence.
        </p>
        <form onSubmit={(e) => void handleSearch(e)} className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-grey-700">
              <input
                type="radio"
                name="entityType"
                checked={!isCompany}
                onChange={() => setIsCompany(false)}
                className="h-4 w-4 accent-brand-600"
              />
              Personal
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-grey-700">
              <input
                type="radio"
                name="entityType"
                checked={isCompany}
                onChange={() => setIsCompany(true)}
                className="h-4 w-4 accent-brand-600"
              />
              Company
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a person or company on LinkedIn..."
                className="h-11 w-full rounded-xl border border-grey-200 pl-9 pr-3 text-sm text-grey-900 placeholder:text-grey-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-medium text-white transition duration-200 hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
          No results found. Try a different search term or entity type.
        </div>
      )}

      {results && results.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-grey-500">
            {results.length} result{results.length === 1 ? '' : 's'} — click a card to analyze
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((item, index) => (
              <button
                key={`${item.id || item.profileUrl || item.name}-${index}`}
                type="button"
                onClick={() => onSelect(item)}
                className="group flex flex-col rounded-xl border border-grey-200 bg-white p-5 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
              >
                <div className="flex items-start gap-3">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className={`h-12 w-12 shrink-0 object-cover ${item.isCompany ? 'rounded-lg' : 'rounded-full'}`}
                    />
                  ) : (
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br from-brand-600 to-purple-600 text-sm font-semibold text-white ${
                        item.isCompany ? 'rounded-lg' : 'rounded-full'
                      }`}
                    >
                      {initialsOf(item.name || '?')}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-grey-900">{item.name || 'Unknown'}</p>
                      {item.verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      {item.premium && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-medium text-warning-700">
                          <Crown className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-grey-600">
                      {item.isCompany ? item.industry || 'N/A' : item.headline || '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-grey-500">
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.location || '—'}</span>
                  </span>
                  {item.followersCount > 0 && (
                    <span className="flex shrink-0 items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {formatNumber(item.followersCount)} followers
                    </span>
                  )}
                </div>
                <span className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 text-xs font-medium text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white">
                  Select &amp; Analyze
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
