import type {
  DistributionItem,
  EngagementRecord,
  Person,
  PostItem,
  ProfileDetails,
  SeniorityLevel,
} from './types';
import { extractProfileDetailsFromResponse } from './profile-details';

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

/**
 * Decodes literal unicode escape sequences (e.g. "\\u270D") that arrive
 * double-encoded in workflow data so labels like "Enhanced Article" render
 * the real emoji character instead of the raw escape text.
 */
export function decodeUnicodeEscapes(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
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

export function activityIdsFrom(value: string): string[] {
  const text = (value || '').trim();
  if (!text) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const match of text.matchAll(/urn:li:(?:activity|ugcpost):(\d{8,})/gi)) {
    push(match[1]);
  }
  for (const match of text.matchAll(/\d{8,}/g)) {
    push(match[0]);
  }
  return ids;
}

export function activityIdFrom(value: string): string {
  return activityIdsFrom(value)[0] || '';
}

function linkedInHttpUrl(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) && /linkedin\.com/i.test(trimmed)) return trimmed;
  if (/^(www\.)?linkedin\.com\//i.test(trimmed)) return `https://${trimmed}`;
  return '';
}

export function linkedInActivityUrl(activityId: string): string {
  return `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;
}

export function resolvePostUrl(postUrl: string, shareUrl: string, postKey: string): string {
  for (const candidate of [postUrl, shareUrl, postKey]) {
    const url = linkedInHttpUrl(candidate);
    if (url) return url;
  }
  const activityId =
    activityIdFrom(postKey) || activityIdFrom(postUrl) || activityIdFrom(shareUrl);
  if (activityId) return linkedInActivityUrl(activityId);
  return '';
}

export function postIdentityKeys(post: PostItem): Set<string> {
  const keys = new Set<string>();
  for (const value of [post.id, post.activityKey, post.socialId, post.shareUrl]) {
    const trimmed = (value || '').trim();
    if (!trimmed) continue;
    keys.add(trimmed);
    keys.add(trimmed.toLowerCase());
    for (const id of activityIdsFrom(trimmed)) keys.add(id);
  }
  return keys;
}

export function postMatchesKey(post: PostItem, postKey: string): boolean {
  const key = (postKey || '').trim();
  if (!key) return false;
  const keys = postIdentityKeys(post);
  if (keys.has(key) || keys.has(key.toLowerCase())) return true;
  return activityIdsFrom(key).some((id) => keys.has(id));
}

export function findPostForKey(posts: PostItem[], postKey: string): PostItem | undefined {
  return posts.find((post) => postMatchesKey(post, postKey));
}

export function postEngagementTotal(post: PostItem): number {
  return (post.reactionCounter || 0) + (post.commentCounter || 0) + (post.repostCounter || 0);
}

export function isCSuiteOrFounder(person: Person): boolean {
  if (person.seniority === 'C-Level') return true;
  return /\b(founder|co-founder|cofounder|chief|ceo|cto|cfo|coo|cmo|cio)\b/i.test(
    `${person.title} ${person.headline} ${person.seniorityRaw}`
  );
}

export function reactionForPost(
  person: Person,
  post: PostItem,
  engagements: EngagementRecord[] = []
): string {
  const fromInteraction = person.interactions.find(
    (interaction) => postMatchesKey(post, interaction.postKey) || postMatchesKey(post, interaction.postUrl)
  );
  if (fromInteraction?.reactionType) return fromInteraction.reactionType;
  const fromEngagement = engagements.find(
    (engagement) =>
      (engagement.personSlug === person.slug || engagement.personSlug === person.linkedinUrl) &&
      postMatchesKey(post, engagement.postKey)
  );
  return fromEngagement?.reactionType || 'LIKE';
}

export function peopleForPost(
  post: PostItem,
  people: Person[],
  engagements: EngagementRecord[] = []
): Person[] {
  const matched: Person[] = [];
  const seen = new Set<string>();
  const engagerSlugs = new Set(post.engagerSlugs);

  for (const person of people) {
    if (seen.has(person.slug)) continue;
    const engagedBySlug = engagerSlugs.has(person.slug);
    const engagedByInteraction = person.interactions.some(
      (interaction) =>
        postMatchesKey(post, interaction.postKey) || postMatchesKey(post, interaction.postUrl)
    );
    const engagedByRecord = engagements.some(
      (engagement) =>
        (engagement.personSlug === person.slug || engagement.personSlug.toLowerCase() === person.slug) &&
        postMatchesKey(post, engagement.postKey)
    );
    if (!engagedBySlug && !engagedByInteraction && !engagedByRecord) continue;
    seen.add(person.slug);
    matched.push(person);
  }
  return matched;
}

export interface PersonReactedPost {
  url: string;
  reactionType: string;
  snippet: string;
  datetime: string;
}

export function listPersonReactedPosts(
  person: Person,
  posts: PostItem[],
  engagements: EngagementRecord[] = []
): PersonReactedPost[] {
  const items: PersonReactedPost[] = [];
  const seen = new Set<string>();

  const push = (url: string, reactionType: string, snippet: string, datetime: string) => {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    items.push({
      url: normalized,
      reactionType: reactionType || 'LIKE',
      snippet,
      datetime,
    });
  };

  for (const interaction of person.interactions) {
    const post = findPostForKey(posts, interaction.postKey);
    const url = resolvePostUrl(
      interaction.postUrl,
      post?.shareUrl ?? '',
      interaction.postKey || post?.activityKey || post?.socialId || ''
    );
    if (!url) continue;
    push(
      url,
      interaction.reactionType,
      interaction.postSnippet || post?.text || '',
      post?.parsedDatetime || ''
    );
  }

  for (const engagement of engagements) {
    if (engagement.personSlug !== person.slug) continue;
    const post = findPostForKey(posts, engagement.postKey);
    const url = resolvePostUrl('', post?.shareUrl ?? '', engagement.postKey || post?.activityKey || '');
    if (!url) continue;
    push(url, engagement.reactionType, post?.text || '', post?.parsedDatetime || '');
  }

  for (const post of posts) {
    if (!post.engagerSlugs.includes(person.slug)) continue;
    const url = resolvePostUrl('', post.shareUrl, post.activityKey || post.id);
    if (!url) continue;
    const matching = person.interactions.find((interaction) => {
      const interactionId = activityIdFrom(interaction.postKey);
      return (
        interactionId !== '' &&
        (interactionId === activityIdFrom(post.activityKey) || interactionId === activityIdFrom(post.id))
      );
    });
    push(url, matching?.reactionType || 'LIKE', post.text, post.parsedDatetime);
  }

  return items;
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

const COMPANY_LEGAL_HINT =
  /\b(inc|llc|ltd|llp|plc|pvt|gmbh|labs|ventures|studio|technologies|academy|capital|partners|group|company|corp|limited|bank|university|college|institute|hospital|securities|holdings|consulting)\b/i;
const LEGAL_HINT_TOKENS = new Set([
  'inc',
  'llc',
  'ltd',
  'llp',
  'plc',
  'pvt',
  'gmbh',
  'labs',
  'ventures',
  'studio',
  'technologies',
  'academy',
  'capital',
  'partners',
  'group',
  'company',
  'corp',
  'limited',
  'bank',
  'university',
  'college',
  'institute',
  'hospital',
  'securities',
  'holdings',
  'consulting',
]);
const ROLE_WORD =
  /\b(developer|designer|engineer|analyst|manager|director|consultant|specialist|intern|coordinator|architect|leader|builder|fixer|auditor|creator|marketer|assistant|strategist|planner|buyer|support|student|scientist|operator|supervisor|programmer|author|coach|editor|recruiter|founder|enthusiast|professional|dancer|writer|accountant|artist|entrepreneur|associate|executive|technician|volunteer|undergrad|candidate|investor|attorney|psychologist|finalist|officer|graduate|hunter|learner)\b/i;
const JOB_OR_FUNCTION_ENDING =
  /\b(accountant|artist|entrepreneur|associate|executive|technician|volunteer|undergrad|undergraduate|candidate|investor|attorney|psychologist|finalist|intern|student|analyst|manager|director|specialist|consultant|designer|developer|engineer|scientist|marketer|recruiter|coach|editor|writer|dancer|professional|officer|graduate|hunter|learner|lead|seo|servicing|management|strategy|operations|marketing|development|analytics|experience|advisory|partnerships|gtm|hr|onboarding|lending|funnels|connect|vet)\s*$/i;
const NOT_A_COMPANY = new Set([
  'react',
  'react.js',
  'reactjs',
  'react js',
  'golang',
  'go',
  'java',
  'python',
  'sql',
  'pl sql',
  'nodejs',
  'node.js',
  'node js',
  'mern',
  'mean',
  'aws',
  'azure',
  'gcp',
  'cloud',
  'cad',
  'javascript',
  'typescript',
  'django',
  'html',
  'css',
  'kafka',
  'rust',
  'ml',
  'ai',
  'genai',
  'llm',
  'seo',
  'sem',
  'abm',
  'ppc',
  'gtm',
  'saas',
  'b2b',
  'b2c',
  'excel',
  '.net',
  'spring boot',
  'leetcode',
  'mern stack',
  'full stack',
  'google cloud',
  'microsoft 365',
  'generative ai',
  'google ads',
  'e-learning',
  'programmatic',
  'performance marketing',
  'life sciences',
  'computer engineering',
  'user experience',
  'business development',
  'client servicing',
  'm&a',
  'startups',
  'senior',
  'junior',
  'avp',
  'sde',
  'ceo',
  'cto',
  'cfo',
  'cmo',
  'hr',
  'ca',
  'cma',
  'cfa',
  'mba',
  'briefs',
  'be',
  'fintech',
  'payments',
  'payment',
  'marketing',
  'strategy',
  'recruitment',
  'speech',
  'sales',
  'product',
  'design',
  'operations',
  'engineering',
  'technology',
  'digital',
  'innovation',
  'finance',
  'banking',
  'cards',
  'growth',
  'scale',
  'leadership',
  'coach',
  'author',
  'programmer',
  'hiring',
  'editor',
  'building',
  'support',
  'rethink',
  'fintech professional',
  'brand strategy',
  'p&l leadership',
  "founder's office",
  'founders office',
  "ceo's office",
  'agentic ai',
  'open to opportunities',
  'job hunting',
  'final year',
  'scifi',
  'traceability',
  'upi autopay',
  'bfsi & fintech',
  'oracle oci',
  'ceph',
  'disabled vet',
  'banking solution',
  'den',
]);
const GENERIC_TOKEN = new Set([
  'fintech',
  'payments',
  'payment',
  'marketing',
  'strategy',
  'brand',
  'digital',
  'transformation',
  'enterprise',
  'saas',
  'b2b',
  'b2c',
  'product',
  'people',
  'purpose',
  'global',
  'trust',
  'infrastructure',
  'operations',
  'banking',
  'leadership',
  'growth',
  'ai',
  'agentic',
  'cloud',
  'design',
  'software',
  'developer',
  'specialist',
  'workflows',
  'platforms',
  'and',
  'of',
  'the',
  'in',
  'for',
  'online',
  'investment',
  'solutions',
  'apps',
  'stories',
  'sell',
  'scaled',
  'crm',
  'process',
  'processos',
  'optimization',
  'quality',
  'technical',
  'strategic',
  'consumer',
  'platform',
  'program',
  'project',
  'business',
  'risk',
  'change',
  'client',
]);

export function cleanCompanyName(name: string): string {
  return name
    .trim()
    .replace(/^[|\-#•·\s]+/, '')
    .replace(/^(?:of|at|the)\s+/i, '')
    .replace(/^(?:avp|sde|hr|vp|svp|ceo|cto|cfo)-/i, '')
    .replace(/^(?:cmo|ceo|cto|cfo|coo|cpo|vp|co-founder|founder),?\s+/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+[|•·].*$/, '')
    .replace(/\s+[-–—]\s+(?:verify|building|fintech|open to).*$/i, '')
    .replace(/\s+(data analyst|certified expert|certified|mba|phd)$/i, '')
    .replace(/\.+$/, '')
    .trim();
}

/** True when a string is an employer name, not a role, skill, or headline fragment. */
export function isCompanyDisplayName(name: string): boolean {
  const raw = cleanCompanyName(name);
  if (!raw) return false;
  const v = raw.toLowerCase();
  if (v.length < 2 || v.length > 48) return false;
  if (v.length < 3 && raw !== raw.toUpperCase()) return false;
  if (NOT_A_COMPANY.has(v)) return false;
  if (/^#/.test(raw) || /^[|\-•·]/.test(raw)) return false;
  if (/i['’]m\s/.test(v) || /[:;]/.test(raw)) return false;
  if (/!/.test(raw) && !COMPANY_LEGAL_HINT.test(v)) return false;
  if ((raw.match(/[^A-Za-z0-9²&\s.,'’+-]/g) || []).length >= 2) return false;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(raw)) return false;
  if (/^(ex[-.\s]|former\s|prev\.?\s|previously\s|founded\b|chief\b)/i.test(raw)) return false;
  if (
    /^(designing|building|enabling|driving|scaling|helping|turning|evaluating|hiring|working|leading|shaping|investing|navigating)\b/i.test(
      raw
    )
  ) {
    return false;
  }
  if (/\b(enthusiast|cleared|runner-up|y\.?o\.?e|followers|impressions)\b/i.test(v)) return false;
  if (/\b(ceo|cfo|cto|cmo|coo|founder)['’]?s?\s+office\b/i.test(v)) return false;
  if (/['’]\d{2}\b/.test(raw)) return false;
  if (/\b(b\.?tech|m\.?tech|mba|phd|ca finalist|us cma|iitm bs)\b/i.test(v) && !COMPANY_LEGAL_HINT.test(v)) {
    return false;
  }
  if (/,/.test(raw) && !COMPANY_LEGAL_HINT.test(v)) return false;
  if (/^[A-Za-z]+\.\s+[A-Za-z]+$/.test(raw)) return false;
  const spaceTokens = v.split(/\s+/).filter(Boolean).map((t) => t.replace(/[.,]/g, ''));
  const hyphenTokens = v.split(/[\s/&,_-]+/).filter((t) => t && t !== '&');
  const hasLegalHint = spaceTokens.some((t) => LEGAL_HINT_TOKENS.has(t));
  if (hasLegalHint) {
    const rest = spaceTokens.filter((t) => !LEGAL_HINT_TOKENS.has(t));
    if (rest.length === 0) return false;
    if (rest.every((t) => GENERIC_TOKEN.has(t) || NOT_A_COMPANY.has(t))) return false;
    return true;
  }
  if (ROLE_WORD.test(v)) return false;
  if (JOB_OR_FUNCTION_ENDING.test(v)) return false;
  if (hyphenTokens.length >= 3) return false;
  if (hyphenTokens.length >= 2 && hyphenTokens.every((t) => GENERIC_TOKEN.has(t) || NOT_A_COMPANY.has(t))) {
    return false;
  }
  return true;
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

export function extractProfileDetails(raw: unknown): ProfileDetails | null {
  return extractProfileDetailsFromResponse(raw);
}
