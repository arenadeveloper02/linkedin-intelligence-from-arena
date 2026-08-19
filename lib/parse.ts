import type {
  CompanyProfile,
  DashboardData,
  EngagementRecord,
  Person,
  PersonInteraction,
  PostItem,
} from './types';
import { classifySeniority } from './utils';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,+\s]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function deepDecode(value: unknown, depth = 4): unknown {
  let current: unknown = value;
  for (let i = 0; i < depth; i += 1) {
    if (typeof current !== 'string') return current;
    const trimmed = current.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
      return current;
    }
    try {
      current = JSON.parse(trimmed);
    } catch {
      return current;
    }
  }
  return current;
}

function pickString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = asString(candidate[0]);
      if (first) return first;
    }
    const value = asString(candidate);
    if (value) return value;
  }
  return '';
}

function pickNumber(record: UnknownRecord, keys: string[]): number {
  for (const key of keys) {
    if (key in record) {
      const value = asNumber(record[key]);
      if (value !== 0) return value;
    }
  }
  return 0;
}

export function extractActivityId(value: string): string {
  const match = value.match(/\d{8,}/);
  if (match) return match[0];
  return value.trim().toLowerCase();
}

function parseCompanyProfile(raw: unknown): CompanyProfile | null {
  const decoded = deepDecode(raw);
  if (!isRecord(decoded)) return null;
  const name = pickString(decoded, ['name', 'company_name', 'companyName', 'universal_name', 'universalName']);
  const logoUrl = pickString(decoded, ['logo', 'logo_url', 'logoUrl', 'image', 'image_url', 'profile_picture']);
  const followerCount = pickNumber(decoded, ['follower_count', 'followers_count', 'followers', 'followerCount']);
  const tagline = pickString(decoded, ['tagline', 'description', 'about', 'summary']);
  const employeeCount = pickNumber(decoded, ['employee_count', 'employees', 'staff_count', 'employeeCount', 'staffCount']);
  const industry = pickString(decoded, ['industry', 'industries']);
  if (!name && !tagline && followerCount === 0) return null;
  return { name, logoUrl, followerCount, tagline, employeeCount, industry };
}

function parsePosts(raw: unknown): PostItem[] {
  const decoded = deepDecode(raw);
  let items: unknown[] = [];
  if (Array.isArray(decoded)) {
    items = decoded;
  } else if (isRecord(decoded)) {
    const inner = deepDecode(decoded.items ?? decoded.posts ?? decoded.data);
    if (Array.isArray(inner)) items = inner;
  }
  const posts: PostItem[] = [];
  for (const entry of items) {
    const record = deepDecode(entry);
    if (!isRecord(record)) continue;
    const id = pickString(record, ['id', 'urn', 'post_urn', 'activity_urn', 'postId']);
    const shareUrl = pickString(record, ['share_url', 'shareUrl', 'url', 'post_url', 'link']);
    if (!id && !shareUrl) continue;
    posts.push({
      id: id || shareUrl,
      activityKey: extractActivityId(id || shareUrl),
      text: pickString(record, ['text', 'commentary', 'content', 'post_text']),
      parsedDatetime: pickString(record, ['parsed_datetime', 'parsedDatetime', 'posted_at', 'published_at', 'date', 'time']),
      reactionCounter: pickNumber(record, ['reaction_counter', 'reactionCounter', 'num_reactions', 'reactions', 'likes']),
      commentCounter: pickNumber(record, ['comment_counter', 'commentCounter', 'num_comments', 'comments']),
      repostCounter: pickNumber(record, ['repost_counter', 'repostCounter', 'num_reposts', 'reposts', 'shares']),
      shareUrl,
      engagerSlugs: [],
    });
  }
  return posts;
}

interface RawPersonRow {
  urn: string;
  fullName: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  headline: string;
  title: string;
  seniorityRaw: string;
  decisionMakerRaw: string;
  companyName: string;
  companyUrl: string;
  location: string;
  country: string;
  connectionDegree: string;
  followersCount: number;
  connectionsCount: number;
  relationshipType: string;
  reactionType: string;
  postUrl: string;
  postUrn: string;
  postSnippet: string;
  targetCompany: string;
  avatarUrl: string;
}

function rowFromArray(cells: unknown[]): RawPersonRow {
  const at = (index: number): string => asString(cells[index]);
  const numAt = (index: number): number => asNumber(cells[index]);
  let linkedinUrl = at(4);
  if (!linkedinUrl.includes('linkedin.com')) {
    const found = cells.find((cell) => typeof cell === 'string' && cell.includes('linkedin.com/in'));
    if (typeof found === 'string') linkedinUrl = found;
  }
  let avatarUrl = at(27);
  if (!avatarUrl.startsWith('http')) {
    const found = cells.find(
      (cell) =>
        typeof cell === 'string' &&
        cell.startsWith('http') &&
        (cell.includes('licdn') || cell.includes('media') || cell.includes('avatar'))
    );
    avatarUrl = typeof found === 'string' ? found : '';
  }
  return {
    urn: at(0),
    fullName: at(1),
    firstName: at(2),
    lastName: at(3),
    linkedinUrl,
    headline: at(6),
    title: at(7),
    seniorityRaw: at(8),
    decisionMakerRaw: at(9),
    companyName: at(10),
    companyUrl: at(11),
    location: at(14),
    country: at(15),
    connectionDegree: at(16),
    followersCount: numAt(17),
    connectionsCount: numAt(18),
    relationshipType: at(19),
    reactionType: at(21),
    postUrl: at(23),
    postUrn: at(24),
    postSnippet: at(25),
    targetCompany: at(26),
    avatarUrl,
  };
}

function rowFromRecord(record: UnknownRecord): RawPersonRow {
  return {
    urn: pickString(record, ['profile_urn_id', 'profileUrnId', 'urn', 'urn_id', 'id']),
    fullName: pickString(record, ['full_name', 'fullName', 'name']),
    firstName: pickString(record, ['first_name', 'firstName']),
    lastName: pickString(record, ['last_name', 'lastName']),
    linkedinUrl: pickString(record, ['linkedin_url', 'linkedinUrl', 'profile_url', 'url']),
    headline: pickString(record, ['headline']),
    title: pickString(record, ['title', 'job_title']),
    seniorityRaw: pickString(record, ['seniority_level', 'seniorityLevel', 'seniority']),
    decisionMakerRaw: pickString(record, ['is_decision_maker', 'isDecisionMaker', 'decision_maker']),
    companyName: pickString(record, ['company_name', 'companyName', 'company']),
    companyUrl: pickString(record, ['company_url', 'companyUrl']),
    location: pickString(record, ['location', 'city']),
    country: pickString(record, ['country']),
    connectionDegree: pickString(record, ['connection_degree', 'connectionDegree', 'degree']),
    followersCount: pickNumber(record, ['followers_count', 'followersCount', 'followers']),
    connectionsCount: pickNumber(record, ['connections_count', 'connectionsCount', 'connections']),
    relationshipType: pickString(record, ['relationship_type', 'relationshipType']),
    reactionType: pickString(record, ['reaction_type', 'reactionType', 'reaction']),
    postUrl: pickString(record, ['post_url', 'postUrl']),
    postUrn: pickString(record, ['post_urn', 'postUrn']),
    postSnippet: pickString(record, ['post_snippet', 'postSnippet']),
    targetCompany: pickString(record, ['target_company', 'targetCompany']),
    avatarUrl: pickString(record, ['avatar_url', 'avatarUrl', 'avatar', 'profile_picture']),
  };
}

function slugForRow(row: RawPersonRow): string {
  if (row.urn) return row.urn;
  if (row.linkedinUrl) {
    const cleaned = row.linkedinUrl.replace(/\/+$/, '');
    const segments = cleaned.split('/');
    const last = segments[segments.length - 1];
    if (last) return last.toLowerCase();
  }
  return row.fullName.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown';
}

function isYes(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === 'y';
}

function computeInternal(row: RawPersonRow): boolean {
  const rel = row.relationshipType.toLowerCase();
  if (rel.includes('employee') || rel.includes('internal')) return true;
  if (rel.includes('external')) return false;
  const companyName = row.companyName.trim().toLowerCase();
  const target = row.targetCompany.trim().toLowerCase();
  if (!companyName || !target) return false;
  return companyName === target || companyName.includes(target) || target.includes(companyName);
}

function toInteraction(row: RawPersonRow): PersonInteraction | null {
  if (!row.postUrn && !row.postUrl && !row.reactionType) return null;
  return {
    postKey: extractActivityId(row.postUrn || row.postUrl),
    postUrl: row.postUrl,
    postSnippet: row.postSnippet,
    reactionType: (row.reactionType || 'LIKE').toUpperCase(),
  };
}

function parsePeople(raw: unknown): Person[] {
  const decoded = deepDecode(raw);
  let values: unknown[] = [];
  if (Array.isArray(decoded)) {
    values = decoded;
  } else if (isRecord(decoded)) {
    const inner = deepDecode(decoded.values ?? decoded.rows ?? decoded.data);
    if (Array.isArray(inner)) values = inner;
  }
  const map = new Map<string, Person>();
  for (const value of values) {
    const decodedRow = deepDecode(value);
    let row: RawPersonRow | null = null;
    if (Array.isArray(decodedRow)) row = rowFromArray(decodedRow);
    else if (isRecord(decodedRow)) row = rowFromRecord(decodedRow);
    if (!row) continue;
    if (!row.fullName && !row.urn && !row.linkedinUrl) continue;
    const slug = slugForRow(row);
    const interaction = toInteraction(row);
    const existing = map.get(slug);
    if (existing) {
      existing.engagementCount += 1;
      if (interaction) {
        const duplicate = existing.interactions.some(
          (i) => i.postKey !== '' && i.postKey === interaction.postKey && i.reactionType === interaction.reactionType
        );
        if (!duplicate) existing.interactions.push(interaction);
      }
      if (!existing.avatarUrl && row.avatarUrl) existing.avatarUrl = row.avatarUrl;
      if (!existing.headline && row.headline) existing.headline = row.headline;
      continue;
    }
    map.set(slug, {
      slug,
      fullName: row.fullName || `${row.firstName} ${row.lastName}`.trim(),
      firstName: row.firstName,
      lastName: row.lastName,
      linkedinUrl: row.linkedinUrl,
      headline: row.headline,
      title: row.title,
      seniorityRaw: row.seniorityRaw,
      seniority: classifySeniority(row.seniorityRaw, row.title, row.headline),
      isDecisionMaker: isYes(row.decisionMakerRaw),
      companyName: row.companyName,
      companyUrl: row.companyUrl,
      location: row.location,
      country: row.country,
      connectionDegree: row.connectionDegree,
      followersCount: row.followersCount,
      connectionsCount: row.connectionsCount,
      relationshipType: row.relationshipType,
      isInternal: computeInternal(row),
      avatarUrl: row.avatarUrl,
      targetCompany: row.targetCompany,
      interactions: interaction ? [interaction] : [],
      engagementCount: 1,
    });
  }
  return Array.from(map.values());
}

function parseEngagements(raw: unknown): EngagementRecord[] {
  const decoded = deepDecode(raw);
  let records: unknown[] = [];
  if (Array.isArray(decoded)) {
    records = decoded;
  } else if (isRecord(decoded)) {
    const inner = deepDecode(
      decoded.engagementRecords ?? decoded.engagement_records ?? decoded.records ?? decoded.results
    );
    if (Array.isArray(inner)) records = inner;
  }
  const engagements: EngagementRecord[] = [];
  for (const entry of records) {
    const record = deepDecode(entry);
    if (!isRecord(record)) continue;
    const postRef = pickString(record, ['postId', 'post_id', 'postUrn', 'post_urn', 'post']);
    const personSlug = pickString(record, [
      'personSlug',
      'person_slug',
      'profileUrnId',
      'profile_urn_id',
      'profileUrn',
      'profile_urn',
      'urnId',
      'urn_id',
      'personId',
      'slug',
    ]);
    if (!postRef && !personSlug) continue;
    engagements.push({
      postKey: postRef ? extractActivityId(postRef) : '',
      personSlug,
      engagementType: pickString(record, ['engagementType', 'engagement_type', 'type', 'kind']) || 'REACTION',
      reactionType: pickString(record, ['reactionType', 'reaction_type', 'reaction']).toUpperCase(),
    });
  }
  return engagements;
}

export function parseWorkflowResponse(raw: unknown): DashboardData {
  const root: UnknownRecord = isRecord(raw) ? raw : {};
  const decodedOutput = deepDecode(root.output);
  const output: UnknownRecord = isRecord(decodedOutput) ? decodedOutput : root;
  const rows = Array.isArray(output.rows) ? output.rows : [];
  let payload: UnknownRecord = output;
  if (rows.length > 0) {
    const firstRow = deepDecode(rows[0]);
    if (isRecord(firstRow)) {
      const inner = deepDecode(firstRow.output);
      payload = isRecord(inner) ? inner : firstRow;
    }
  }

  const company = parseCompanyProfile(payload.company_profile ?? payload.companyProfile);
  const posts = parsePosts(payload.recent_list_posts ?? payload.recentListPosts ?? payload.posts);
  const people = parsePeople(payload.users_profile_data ?? payload.usersProfileData ?? payload.people);
  const engagements = parseEngagements(
    payload.get_reactions_comments_results ?? payload.getReactionsCommentsResults ?? payload.engagements
  );

  for (const post of posts) {
    const slugs = new Set<string>();
    for (const person of people) {
      if (post.activityKey && person.interactions.some((i) => i.postKey === post.activityKey)) {
        slugs.add(person.slug);
      }
    }
    for (const record of engagements) {
      if (!record.postKey || record.postKey !== post.activityKey || !record.personSlug) continue;
      const match = people.find(
        (p) => p.slug === record.personSlug || p.slug.includes(record.personSlug) || record.personSlug.includes(p.slug)
      );
      if (match) slugs.add(match.slug);
    }
    post.engagerSlugs = Array.from(slugs);
  }

  return { company, posts, people, engagements };
}
