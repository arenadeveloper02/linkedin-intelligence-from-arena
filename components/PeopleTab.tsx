"use client"

import { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import type { Person, SeniorityLevel } from '@/lib/types';
import { formatNumber, initialsOf } from '@/lib/utils';
import { CompanyBadge, DecisionMakerBadge, SeniorityBadge } from '@/components/Widgets';

interface PeopleTabProps {
  people: Person[];
  onSelectPerson: (slug: string) => void;
}

interface PersonCardProps {
  person: Person;
  maxEngagement: number;
  onClick: () => void;
}

function PersonCard({ person, maxEngagement, onClick }: PersonCardProps) {
  const barWidth = maxEngagement > 0 ? Math.max(8, Math.round((person.engagementCount / maxEngagement) * 100)) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-grey-200 bg-white p-4 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
    >
      <div className="flex items-start gap-3">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt={person.fullName} className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {initialsOf(person.fullName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-grey-900">{person.fullName || 'Unknown person'}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-grey-600">{person.headline || person.title || '—'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SeniorityBadge level={person.seniority} />
        <CompanyBadge isInternal={person.isInternal} />
        {person.isDecisionMaker && <DecisionMakerBadge />}
        {person.companyName && (
          <span className="max-w-[160px] truncate rounded-full border border-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600">
            {person.companyName}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-grey-500">
        <span className="flex min-w-0 items-center gap-1 truncate">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{person.location || person.country || '—'}</span>
        </span>
        <span className="shrink-0">
          {person.connectionDegree ? `${person.connectionDegree} · ` : ''}
          {person.followersCount > 0 ? `${formatNumber(person.followersCount)} followers` : '—'}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-grey-500">
          <span>Post engagements</span>
          <span className="font-medium text-grey-700">{person.engagementCount}</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-grey-100">
          <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${barWidth}%` }} />
        </div>
      </div>
    </button>
  );
}

const SENIORITY_CHIPS: SeniorityLevel[] = ['C-Level', 'Director', 'Manager', 'IC'];

const BUCKETS: { level: SeniorityLevel; label: string }[] = [
  { level: 'C-Level', label: 'C-Suite / Founders' },
  { level: 'Director', label: 'Directors' },
  { level: 'Manager', label: 'Managers' },
  { level: 'IC', label: 'Individual Contributors' },
  { level: 'Unknown', label: 'Other' },
];

export default function PeopleTab({ people, onSelectPerson }: PeopleTabProps) {
  const [search, setSearch] = useState('');
  const [seniorities, setSeniorities] = useState<SeniorityLevel[]>([]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [degree, setDegree] = useState('');
  const [decisionOnly, setDecisionOnly] = useState(false);
  const [hideInternal, setHideInternal] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const countries = useMemo(
    () => Array.from(new Set(people.map((p) => p.country.trim()).filter(Boolean))).sort(),
    [people]
  );
  const cities = useMemo(
    () => Array.from(new Set(people.map((p) => p.location.trim()).filter(Boolean))).sort(),
    [people]
  );
  const degrees = useMemo(
    () => Array.from(new Set(people.map((p) => p.connectionDegree.trim()).filter(Boolean))).sort(),
    [people]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return people.filter((p) => {
      if (query) {
        const haystack = `${p.fullName} ${p.title} ${p.headline} ${p.companyName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (seniorities.length > 0 && !seniorities.includes(p.seniority)) return false;
      if (country && p.country !== country) return false;
      if (city && p.location !== city) return false;
      if (degree && p.connectionDegree !== degree) return false;
      if (decisionOnly && !p.isDecisionMaker) return false;
      if (hideInternal && p.isInternal) return false;
      return true;
    });
  }, [people, search, seniorities, country, city, degree, decisionOnly, hideInternal]);

  const maxEngagement = useMemo(() => filtered.reduce((max, p) => Math.max(max, p.engagementCount), 0), [filtered]);

  const toggleSeniority = (level: SeniorityLevel) => {
    setSeniorities((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };

  const selectClass =
    'rounded-lg border border-grey-200 bg-white px-3 py-2 text-xs text-grey-700 focus:border-brand-600 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-grey-200 bg-white p-4 shadow-ds-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, title or company…"
              className="w-full rounded-lg border border-grey-200 py-2 pl-9 pr-3 text-sm text-grey-900 placeholder:text-grey-400 focus:border-brand-600 focus:outline-none"
            />
          </div>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
            <option value="">All countries</option>
            {countries.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
            <option value="">All cities</option>
            {cities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={degree} onChange={(e) => setDegree(e.target.value)} className={selectClass}>
            <option value="">Any degree</option>
            {degrees.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {SENIORITY_CHIPS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => toggleSeniority(level)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  seniorities.includes(level)
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-grey-200 text-grey-600 hover:border-grey-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-grey-700">
            <input
              type="checkbox"
              checked={decisionOnly}
              onChange={(e) => setDecisionOnly(e.target.checked)}
              className="h-4 w-4 rounded border-grey-300 accent-brand-600"
            />
            Decision makers only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-grey-700">
            <input
              type="checkbox"
              checked={hideInternal}
              onChange={(e) => setHideInternal(e.target.checked)}
              className="h-4 w-4 rounded border-grey-300 accent-brand-600"
            />
            Hide internal employees
          </label>
          <span className="ml-auto text-xs text-grey-500">
            {filtered.length} of {people.length} people
          </span>
        </div>
      </div>

      {BUCKETS.map((bucket) => {
        const list = filtered.filter((p) => p.seniority === bucket.level);
        if (list.length === 0) return null;
        const isCollapsed = collapsed[bucket.level] === true;
        return (
          <section key={bucket.level} className="rounded-xl border border-grey-200 bg-white shadow-ds-sm">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => ({ ...prev, [bucket.level]: !isCollapsed }))}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-grey-900">
                {bucket.label}
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{list.length}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-grey-500 transition ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>
            {!isCollapsed && (
              <div className="grid gap-4 border-t border-grey-100 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((person) => (
                  <PersonCard
                    key={person.slug}
                    person={person}
                    maxEngagement={maxEngagement}
                    onClick={() => onSelectPerson(person.slug)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
          No people match the current filters.
        </div>
      )}
    </div>
  );
}
