"use client"

import { ExternalLink, MessageSquare, Repeat2, ThumbsUp, X } from 'lucide-react';
import type { Person, PostItem } from '@/lib/types';
import { formatDate, formatNumber, initialsOf, resolvePostUrl } from '@/lib/utils';
import { ReactionBadge, SeniorityBadge } from '@/components/Widgets';

interface PostModalProps {
  post: PostItem;
  engagers: Person[];
  onClose: () => void;
}

export default function PostModal({ post, engagers, onClose }: PostModalProps) {
  const reactionFor = (person: Person): string =>
    person.interactions.find((i) => i.postKey === post.activityKey)?.reactionType ?? 'LIKE';

  const shareUrl = resolvePostUrl(post.shareUrl, '', post.activityKey);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grey-900/70" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-ds-xl">
        <header className="flex items-center justify-between border-b border-grey-200 p-5">
          <div>
            <h2 className="text-base font-semibold text-grey-900">Post details</h2>
            <p className="text-xs text-grey-500">
              {post.parsedDatetime ? formatDate(post.parsedDatetime) : 'Date unavailable'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-grey-500 hover:bg-grey-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="whitespace-pre-line text-sm text-grey-800">{post.text || 'No content available.'}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
              <ThumbsUp className="h-3 w-3" />
              {formatNumber(post.reactionCounter)} reactions
            </span>
            <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
              <MessageSquare className="h-3 w-3" />
              {formatNumber(post.commentCounter)} comments
            </span>
            <span className="flex items-center gap-1 rounded-full bg-grey-50 px-2.5 py-1 text-xs font-medium text-grey-700">
              <Repeat2 className="h-3 w-3" />
              {formatNumber(post.repostCounter)} reposts
            </span>
            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Open on LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <h3 className="mt-6 text-sm font-semibold text-grey-900">Engagers ({engagers.length})</h3>
          {engagers.length === 0 ? (
            <p className="mt-2 text-xs text-grey-500">No engager records mapped to this post.</p>
          ) : (
            <ul className="mt-3 divide-y divide-grey-100">
              {engagers.map((person) => (
                <li key={person.slug} className="flex items-center gap-3 py-3">
                  {person.avatarUrl ? (
                    <img src={person.avatarUrl} alt={person.fullName} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {initialsOf(person.fullName)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-grey-900">{person.fullName}</span>
                    <span className="block truncate text-xs text-grey-500">
                      {person.title || person.headline || '—'}
                      {person.companyName ? ` · ${person.companyName}` : ''}
                    </span>
                  </span>
                  <SeniorityBadge level={person.seniority} />
                  <ReactionBadge type={reactionFor(person)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
