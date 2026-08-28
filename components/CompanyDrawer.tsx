"use client"

import { ExternalLink, X } from 'lucide-react';
import type { CompanyAggregate, EngagementRecord, PostItem } from '@/lib/types';
import { activityIdFrom, formatNumber, initialsOf, postMatchesKey, SENIORITY_ORDER } from '@/lib/utils';
import { SeniorityBadge } from '@/components/Widgets';

interface CompanyDrawerProps {
  company: CompanyAggregate;
  posts: PostItem[];
  engagements: EngagementRecord[];
  onClose: () => void;
  onSelectPerson: (slug: string) => void;
}

export default function CompanyDrawer({ company, posts, engagements, onClose, onSelectPerson }: CompanyDrawerProps) {
  const sorted = [...company.people].sort(
    (a, b) =>
      SENIORITY_ORDER.indexOf(a.seniority) - SENIORITY_ORDER.indexOf(b.seniority) ||
      b.engagementCount - a.engagementCount
  );
  const decisionMakerCount = company.people.filter(
    (person) =>
      person.seniority === 'C-Level' ||
      person.seniority === 'Director' ||
      /\b(?:vp|svp|evp|vice president)\b/i.test(`${person.title} ${person.headline} ${person.seniorityRaw}`)
  ).length;
  const companyPersonKeys = new Set(
    company.people.flatMap((person) => [person.slug, person.linkedinUrl].map((key) => key.trim().toLowerCase()).filter(Boolean))
  );
  const engagedPostIds = new Set<string>();
  const addPostKey = (postKey: string) => {
    const post = posts.find((candidate) => postMatchesKey(candidate, postKey));
    const canonicalKey = post?.id || activityIdFrom(postKey) || postKey.trim().toLowerCase();
    if (canonicalKey) engagedPostIds.add(canonicalKey);
  };
  for (const person of company.people) {
    for (const interaction of person.interactions) addPostKey(interaction.postKey);
  }
  for (const engagement of engagements) {
    if (companyPersonKeys.has(engagement.personSlug.trim().toLowerCase())) addPostKey(engagement.postKey);
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-grey-900/70" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-ds-xl">
        <header className="flex items-start justify-between border-b border-grey-200 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
              {initialsOf(company.name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-grey-900">{company.name}</h2>
              <p className="text-xs text-grey-500">People who work at this company</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-grey-500 hover:bg-grey-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid grid-cols-3 gap-3 border-b border-grey-100 p-5">
          <div className="rounded-lg bg-grey-50 p-3 text-center">
            <p className="text-lg font-semibold text-grey-900">{formatNumber(company.peopleCount)}</p>
            <p className="text-[11px] text-grey-500">People</p>
          </div>
          <div className="rounded-lg bg-grey-50 p-3 text-center">
            <p className="text-lg font-semibold text-grey-900">{formatNumber(decisionMakerCount)}</p>
            <p className="text-[11px] text-grey-500">Decision Makers</p>
          </div>
          <div className="rounded-lg bg-grey-50 p-3 text-center">
            <p className="text-lg font-semibold text-grey-900">{formatNumber(engagedPostIds.size)}</p>
            <p className="text-[11px] text-grey-500">Posts Engaged</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-grey-100 px-5 py-3">
          {SENIORITY_ORDER.filter((level) => company.seniorityCounts[level] > 0).map((level) => (
            <span
              key={level}
              className="rounded-full border border-grey-200 bg-grey-50 px-2 py-0.5 text-[11px] font-medium text-grey-700"
            >
              {level === 'Unknown' ? 'Other' : level}: {company.seniorityCounts[level]}
            </span>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="shrink-0 px-5 pb-2 pt-4 text-xs font-semibold text-grey-700">People from this Company</p>
          {sorted.length === 0 ? (
            <p className="px-5 py-3 text-xs text-grey-500">No enriched people are available for this company.</p>
          ) : (
            <ul className="flex-1 divide-y divide-grey-100 overflow-y-auto">
              {sorted.map((person) => (
                <li key={person.slug}>
                  <button
                    type="button"
                    onClick={() => onSelectPerson(person.slug)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-grey-50"
                  >
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt={person.fullName} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {initialsOf(person.fullName)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-grey-900">{person.fullName}</span>
                      <span className="block truncate text-xs text-grey-500">{person.title || person.headline || '—'}</span>
                    </span>
                    <SeniorityBadge level={person.seniority} />
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
