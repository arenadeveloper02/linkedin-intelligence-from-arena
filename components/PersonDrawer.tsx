"use client"

import { useMemo } from 'react';
import { ExternalLink, Users, X } from 'lucide-react';
import type { EngagementRecord, Person, PostItem } from '@/lib/types';
import { decodeUnicodeEscapes, formatDate, formatNumber, initialsOf, listPersonReactedPosts } from '@/lib/utils';
import { CompanyBadge, DecisionMakerBadge, ReactionBadge, SeniorityBadge } from '@/components/Widgets';

interface PersonDrawerProps {
  person: Person;
  posts: PostItem[];
  engagements?: EngagementRecord[];
  onClose: () => void;
}

export default function PersonDrawer({ person, posts, engagements = [], onClose }: PersonDrawerProps) {
  const reactedPosts = useMemo(
    () =>
      listPersonReactedPosts(person, posts, engagements).sort((a, b) => {
        const aTime = Date.parse(a.datetime) || 0;
        const bTime = Date.parse(b.datetime) || 0;
        return bTime - aTime;
      }),
    [person, posts, engagements]
  );

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-grey-900/70" onClick={onClose} aria-hidden="true" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-ds-xl">
        <header className="flex items-start justify-between border-b border-grey-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-grey-500">Person details</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-grey-500 transition duration-200 hover:bg-grey-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt={person.fullName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700">
                {initialsOf(person.fullName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-grey-900">{person.fullName || 'Unknown person'}</h3>
              <p className="mt-0.5 text-sm text-grey-600">{person.headline || person.title || '—'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <SeniorityBadge level={person.seniority} />
                <CompanyBadge isInternal={person.isInternal} />
                {person.isDecisionMaker && <DecisionMakerBadge />}
              </div>
            </div>
          </div>

          {person.linkedinUrl && (
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition duration-200 hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-brand-600/30"
            >
              Open LinkedIn profile
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {(person.followersCount > 0 || person.connectionsCount > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {person.followersCount > 0 && (
                <div className="rounded-lg border border-grey-200 p-3">
                  <p className="flex items-center gap-1 text-[11px] text-grey-500">
                    <Users className="h-3.5 w-3.5" /> Followers
                  </p>
                  <p className="mt-1 text-lg font-semibold text-grey-900">{formatNumber(person.followersCount)}</p>
                </div>
              )}
              {person.connectionsCount > 0 && (
                <div className="rounded-lg border border-grey-200 p-3">
                  <p className="flex items-center gap-1 text-[11px] text-grey-500">
                    <Users className="h-3.5 w-3.5" /> Connections
                  </p>
                  <p className="mt-1 text-lg font-semibold text-grey-900">{formatNumber(person.connectionsCount)}</p>
                </div>
              )}
            </div>
          )}

          <dl className="mt-3 space-y-2 text-sm">
            {person.companyName && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-grey-500">Company</dt>
                <dd className="truncate font-medium text-grey-900">
                  {person.companyUrl ? (
                    <a href={person.companyUrl} target="_blank" rel="noreferrer" className="text-brand-600 transition duration-200 hover:text-brand-700">
                      {person.companyName}
                    </a>
                  ) : (
                    person.companyName
                  )}
                </dd>
              </div>
            )}
          </dl>

          <h4 className="mt-4 text-sm font-semibold text-grey-900">
            Posts liked or reacted ({reactedPosts.length})
          </h4>
          {reactedPosts.length === 0 ? (
            <p className="mt-2 text-xs text-grey-500">No liked or reacted post links found for this person.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {reactedPosts.map((item) => (
                <li key={item.url} className="rounded-lg border border-grey-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <ReactionBadge type={item.reactionType} />
                    {item.datetime && (
                      <span className="text-[11px] text-grey-500">{formatDate(item.datetime)}</span>
                    )}
                  </div>
                  {item.snippet && (
                    <p className="mt-2 line-clamp-3 text-xs text-grey-600">
                      {decodeUnicodeEscapes(item.snippet)}
                    </p>
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex max-w-full items-start gap-1 break-all text-xs font-medium text-brand-600 transition duration-200 hover:text-brand-700"
                  >
                    {item.url}
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
