"use client"

import { useMemo, useState } from 'react';
import { ArrowUpDown, ExternalLink, MessageSquare, Repeat2, ThumbsUp } from 'lucide-react';
import type { Person, PostItem, SeniorityLevel } from '@/lib/types';
import { formatDate, formatNumber, initialsOf } from '@/lib/utils';

interface PostsTabProps {
  posts: PostItem[];
  people: Person[];
  authorName: string;
  onSelectPost: (id: string) => void;
}

const SENIORITY_OPTIONS: SeniorityLevel[] = ['C-Level', 'Director', 'Manager', 'IC', 'Unknown'];

function toTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function PostsTab({ posts, people, authorName, onSelectPost }: PostsTabProps) {
  const [seniority, setSeniority] = useState<SeniorityLevel | ''>('');
  const [reactions, setReactions] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mostEngaged, setMostEngaged] = useState(false);

  const engagersByPost = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const post of posts) {
      map.set(
        post.id,
        people.filter((p) => post.engagerSlugs.includes(p.slug))
      );
    }
    return map;
  }, [posts, people]);

  const reactionOptions = useMemo(
    () =>
      Array.from(new Set(people.flatMap((p) => p.interactions.map((i) => i.reactionType)).filter(Boolean))).sort(),
    [people]
  );
  const companyOptions = useMemo(
    () => Array.from(new Set(people.map((p) => p.companyName.trim()).filter(Boolean))).sort(),
    [people]
  );

  const filtered = useMemo(() => {
    const list = posts.filter((post) => {
      const engagers = engagersByPost.get(post.id) ?? [];
      if (seniority && !engagers.some((p) => p.seniority === seniority)) return false;
      if (company && !engagers.some((p) => p.companyName === company)) return false;
      if (
        reactions.length > 0 &&
        !engagers.some((p) =>
          p.interactions.some((i) => i.postKey === post.activityKey && reactions.includes(i.reactionType))
        )
      ) {
        return false;
      }
      const time = toTime(post.parsedDatetime);
      if (dateFrom && time > 0 && time < toTime(dateFrom)) return false;
      if (dateTo && time > 0 && time > toTime(`${dateTo}T23:59:59`)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (mostEngaged) {
        return (
          (engagersByPost.get(b.id)?.length ?? 0) - (engagersByPost.get(a.id)?.length ?? 0) ||
          b.reactionCounter - a.reactionCounter
        );
      }
      return toTime(b.parsedDatetime) - toTime(a.parsedDatetime);
    });
  }, [posts, engagersByPost, seniority, company, reactions, dateFrom, dateTo, mostEngaged]);

  const toggleReaction = (type: string) => {
    setReactions((prev) => (prev.includes(type) ? prev.filter((r) => r !== type) : [...prev, type]));
  };

  const selectClass =
    'rounded-lg border border-grey-200 bg-white px-3 py-2 text-xs text-grey-700 focus:border-brand-600 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-grey-200 bg-white p-4 shadow-ds-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={seniority}
            onChange={(e) => setSeniority(e.target.value as SeniorityLevel | '')}
            className={selectClass}
          >
            <option value="">All seniorities</option>
            {SENIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'Unknown' ? 'Other' : option}
              </option>
            ))}
          </select>
          <select value={company} onChange={(e) => setCompany(e.target.value)} className={selectClass}>
            <option value="">All companies</option>
            {companyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
          <span className="text-xs text-grey-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
          <button
            type="button"
            onClick={() => setMostEngaged((value) => !value)}
            className={`ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              mostEngaged
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-grey-200 text-grey-600 hover:border-grey-400'
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {mostEngaged ? 'Most engaged' : 'Newest first'}
          </button>
        </div>
        {reactionOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-grey-600">Reactions:</span>
            {reactionOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleReaction(type)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  reactions.includes(type)
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-grey-200 text-grey-600 hover:border-grey-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filtered.map((post) => {
          const engagers = engagersByPost.get(post.id) ?? [];
          const dmCount = engagers.filter((p) => p.isDecisionMaker).length;
          const cSuiteCount = engagers.filter((p) => p.seniority === 'C-Level').length;
          return (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPost(post.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectPost(post.id);
              }}
              className="cursor-pointer rounded-xl border border-grey-200 bg-white p-5 shadow-ds-sm transition hover:border-brand-600 hover:shadow-ds-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                  {initialsOf(authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-grey-900">{authorName}</p>
                  <p className="text-xs text-grey-500">{post.parsedDatetime ? formatDate(post.parsedDatetime) : 'Date unavailable'}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-grey-700">{post.text || 'No content available.'}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  {engagers.length} engagers
                </span>
                <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
                  {dmCount} decision makers
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {cSuiteCount} C-Suite
                </span>
                <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
                  <ThumbsUp className="h-3 w-3" />
                  {formatNumber(post.reactionCounter)}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
                  <MessageSquare className="h-3 w-3" />
                  {formatNumber(post.commentCounter)}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
                  <Repeat2 className="h-3 w-3" />
                  {formatNumber(post.repostCounter)}
                </span>
                {post.shareUrl && (
                  <a
                    href={post.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View Post
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-10 text-center text-sm text-grey-500">
          No posts match the current filters.
        </div>
      )}
    </div>
  );
}
