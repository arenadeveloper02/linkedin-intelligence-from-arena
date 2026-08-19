import type { CompanyAggregate, DistributionItem, Person, SeniorityLevel } from './types';

export const SENIORITY_ORDER: SeniorityLevel[] = ['C-Level', 'Director', 'Manager', 'IC', 'Unknown'];

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
}

export function formatDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const pretty = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return pretty || email;
}

export function resolvePostUrl(postUrl: string, shareUrl: string, postKey: string): string {
  for (const candidate of [postUrl, shareUrl]) {
    const value = (candidate || '').trim();
    if (/^https?:\/\//i.test(value) && value.toLowerCase().includes('linkedin.com')) return value;
  }
  const key = (postKey || '').trim();
  if (/^\d{8,}$/.test(key)) {
    return `https://www.linkedin.com/feed/update/urn:li:activity:${key}/`;
  }
  return '';
}

export function classifySeniority(raw: string, title: string, headline: string): SeniorityLevel {
  const r = raw.trim().toLowerCase();
  if (r) {
    if (/(c[\s_-]?level|c[\s_-]?suite|cxo|chief|founder|owner|partner|president|exec)/.test(r)) return 'C-Level';
    if (/(vp|vice|director|head)/.test(r)) return 'Director';
    if (/(manager|lead)/.test(r)) return 'Manager';
    if (/(individual|entry|senior|staff|associate|junior|contributor|\bic\b)/.test(r) || r === 'ic') return 'IC';
  }
  const t = `${title} ${headline}`.toLowerCase();
  if (/(chief|\bceo\b|\bcto\b|\bcfo\b|\bcmo\b|\bcoo\b|\bcio\b|founder|co-founder|owner|president)/.test(t)) return 'C-Level';
  if (/(vice president|\bvp\b|\bsvp\b|\bevp\b|director|head of)/.test(t)) return 'Director';
  if (/(manager|lead)/.test(t)) return 'Manager';
  if (t.trim()) return 'IC';
  return 'Unknown';
}

export function buildCompanyAggregates(people: Person[]): CompanyAggregate[] {
  const map = new Map<string, CompanyAggregate>();
  for (const person of people) {
    const name = person.companyName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    let aggregate = map.get(key);
    if (!aggregate) {
      aggregate = {
        name,
        peopleCount: 0,
        decisionMakerCount: 0,
        totalEngagements: 0,
        seniorityCounts: { 'C-Level': 0, Director: 0, Manager: 0, IC: 0, Unknown: 0 },
        people: [],
      };
      map.set(key, aggregate);
    }
    aggregate.peopleCount += 1;
    aggregate.totalEngagements += person.engagementCount;
    if (person.isDecisionMaker) aggregate.decisionMakerCount += 1;
    aggregate.seniorityCounts[person.seniority] += 1;
    aggregate.people.push(person);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.peopleCount - a.peopleCount || b.totalEngagements - a.totalEngagements
  );
}

export function buildDistribution(values: string[]): DistributionItem[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

const REACTION_EMOJI: Record<string, string> = {
  LIKE: '\uD83D\uDC4D',
  PRAISE: '\uD83D\uDE4C',
  EMPATHY: '\uD83E\uDEC2',
  APPRECIATION: '\uD83D\uDE4F',
  INTEREST: '\uD83D\uDCA1',
  INSIGHTFUL: '\uD83D\uDCA1',
  ENTERTAINMENT: '\uD83D\uDE04',
  FUNNY: '\uD83D\uDE04',
  LOVE: '\u2764\uFE0F',
  CELEBRATE: '\uD83C\uDF89',
  SUPPORT: '\uD83E\uDD1D',
  COMMENT: '\uD83D\uDCAC',
  CURIOUS: '\uD83E\uDD14',
};

export function reactionEmoji(type: string): string {
  return REACTION_EMOJI[type.trim().toUpperCase()] ?? '\uD83D\uDC4D';
}
