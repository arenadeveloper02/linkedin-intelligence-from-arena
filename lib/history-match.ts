import type { HistoryEntry } from './types';
import { decodeUnicodeEscapes } from './utils';

export interface HistoryMatchTarget {
  name: string;
  slug: string;
  profileUrl: string;
  accountId: string;
}

export function historyFingerprint(entry: HistoryEntry): string {
  return [
    decodeUnicodeEscapes(entry.title).trim().toLowerCase(),
    entry.companySlug.trim().toLowerCase(),
    entry.accountId.trim().toLowerCase(),
    entry.timestamp.trim(),
  ].join('|');
}

export function historyMatchesTarget(entry: HistoryEntry, target: HistoryMatchTarget): boolean {
  const nameNorm = decodeUnicodeEscapes(target.name).trim().toLowerCase();
  const slugNorm = target.slug.trim().toLowerCase();
  const urlNorm = target.profileUrl.trim().toLowerCase();
  const accountNorm = target.accountId.trim().toLowerCase();
  if (accountNorm && entry.accountId.trim().toLowerCase() === accountNorm) return true;
  if (slugNorm && entry.companySlug.trim().toLowerCase() === slugNorm) return true;
  if (urlNorm && entry.subtitle.trim().toLowerCase() === urlNorm) return true;
  if (nameNorm && decodeUnicodeEscapes(entry.title).trim().toLowerCase() === nameNorm) return true;
  return false;
}

export function findNewHistoryMatch(
  entries: HistoryEntry[],
  target: HistoryMatchTarget,
  seen: Set<string>
): HistoryEntry | undefined {
  const matches = entries.filter(
    (entry) => historyMatchesTarget(entry, target) && !seen.has(historyFingerprint(entry))
  );
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => {
    const aTs = Date.parse(a.timestamp);
    const bTs = Date.parse(b.timestamp);
    const aOk = Number.isFinite(aTs);
    const bOk = Number.isFinite(bTs);
    if (aOk && bOk) return bTs - aTs;
    if (aOk) return -1;
    if (bOk) return 1;
    return 0;
  });
  return matches[0];
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
