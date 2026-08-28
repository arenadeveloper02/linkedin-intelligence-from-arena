"use client"

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { EngagementRecord, Person, PostItem, SeniorityLevel } from '@/lib/types';
import { formatNumber, initialsOf, isCSuiteOrFounder, listPersonReactedPosts } from '@/lib/utils';
import { DecisionMakerBadge, SeniorityBadge } from '@/components/Widgets';

interface PeopleTabProps {
  people: Person[];
  posts: PostItem[];
  engagements: EngagementRecord[];
  onSelectPerson: (slug: string) => void;
}

interface PersonCardProps {
  person: Person;
  maxEngagement: number;
  onClick: () => void;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function PersonCard({ person, maxEngagement, onClick }: PersonCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const barWidth = maxEngagement > 0 ? Math.max(8, Math.round((person.engagementCount / maxEngagement) * 100)) : 0;
  // Use the person's real LinkedIn profile image whenever a valid URL is available;
  // only fall back to the initials placeholder when there is no usable URL or the
  // image fails to load.
  const showAvatar = Boolean(person.avatarUrl) && isHttpUrl(person.avatarUrl) && !avatarError;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-grey-200 bg-white p-4 text-left shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
    >
      <div className="flex items-start gap-3">
        {showAvatar ? (
          <img
            src={person.avatarUrl}
            alt={person.fullName}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setAvatarError(true)}
            className="h-11 w-11 shrink-0 rounded-full border border-grey-100 object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-sm font-semibold text-white">
            {initialsOf(person.fullName)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-grey-900">{person.fullName || 'Unknown person'}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-grey-600">{person.title || person.headline || '—'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SeniorityBadge level={person.seniority} />
        {person.isDecisionMaker && <DecisionMakerBadge />}
        {person.companyName && (
          <span className="max-w-[160px] truncate rounded-full border border-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600">
            {person.companyName}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-grey-500">
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

export default function PeopleTab({ people, posts, engagements, onSelectPerson }: PeopleTabProps) {
  const [search, setSearch] = useState('');
  const [seniorities, setSeniorities] = useState<SeniorityLevel[]>([]);
  const [decisionOnly, setDecisionOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    const list: Person[] = [];
    for (const person of people) {
      if (seen.has(person.slug)) continue;
      seen.add(person.slug);
      list.push(person);
    }
    return list;
  }, [people]);

  const peopleWithPostCounts = useMemo(
    () =>
      uniquePeople.map((person) => {
        const postCount = listPersonReactedPosts(person, posts, engagements).length;
        return postCount === person.engagementCount ? person : { ...person, engagementCount: postCount };
      }),
    [uniquePeople, posts, engagements]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return peopleWithPostCounts.filter((p) => {
      if (query) {
        const haystack = `${p.fullName} ${p.title} ${p.headline} ${p.companyName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (seniorities.length > 0 && !seniorities.includes(p.seniority)) return false;
      const isLeadershipRole = p.seniority === 'C-Level' || p.seniority === 'Director' || isCSuiteOrFounder(p);
      if (decisionOnly && !p.isDecisionMaker && !isLeadershipRole) return false;
      return true;
    });
  }, [peopleWithPostCounts, search, seniorities, decisionOnly]);

  const maxEngagement = useMemo(() => filtered.reduce((max, p) => Math.max(max, p.engagementCount), 0), [filtered]);

  const toggleSeniority = (level: SeniorityLevel) => {
    setSeniorities((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };

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
          <span className="ml-auto text-xs text-grey-500">
            {filtered.length} of {peopleWithPostCounts.length} people
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
        <div className="rounded-xl border border-grey-200 bg-white p-10 text-center shadow-ds-sm">
          <p className="text-sm font-medium text-grey-900">No people match your filters</p>
          <p className="mt-1 text-xs text-grey-500">Try adjusting the search or clearing some filters.</p>
        </div>
      )}
    </div>
  );
}
