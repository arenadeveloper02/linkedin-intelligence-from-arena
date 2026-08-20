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

interface ParseAccumulator {
  company: CompanyProfile | null;
  postsById: Map<string, PostItem>;
  peopleBySlug: Map<string, Person>;
  engagements: EngagementRecord[];
}

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

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[.,'\u2019]/g, '').replace(/\s+/g, ' ');
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
  const entries = Object.entries(record);
  for (const key of keys) {
    const target = normalizeKey(key);
    for (const [recordKey, recordValue] of entries) {
      if (normalizeKey(recordKey) !== target) continue;
      if (Array.isArray(recordValue) && recordValue.length > 0) {
        const first = asString(recordValue[0]);
        if (first) return first;
      }
      const value = asString(recordValue);
      if (value) return value;
    }
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
  const entries = Object.entries(record);
  for (const key of keys) {
    const target = normalizeKey(key);
    for (const [recordKey, recordValue] of entries) {
      if (normalizeKey(recordKey) !== target) continue;
      const value = asNumber(recordValue);
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
  let logoUrl = pickString(decoded, ['logo', 'logo_url', 'logoUrl', 'image', 'image_url', 'profile_picture']);
  if (!isHttpUrl(logoUrl)) logoUrl = '';
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
  const byId = new Map<string, PostItem>();
  for (const entry of items) {
    const record = deepDecode(entry);
    if (!isRecord(record)) continue;
    const id = pickString(record, ['id', 'urn', 'post_urn', 'activity_urn', 'postId']);
    const rawShareUrl = pickString(record, ['share_url', 'shareUrl', 'url', 'post_url', 'link']);
    const shareUrl = isHttpUrl(rawShareUrl) ? rawShareUrl : '';
    if (!id && !rawShareUrl) continue;
    const key = id || rawShareUrl;
    if (byId.has(key)) continue;
    byId.set(key, {
      id: key,
      activityKey: extractActivityId(key),
      text: pickString(record, ['text', 'commentary', 'content', 'post_text']),
      parsedDatetime: pickString(record, ['parsed_datetime', 'parsedDatetime', 'posted_at', 'published_at', 'date', 'time']),
      reactionCounter: pickNumber(record, ['reaction_counter', 'reactionCounter', 'num_reactions', 'reactions', 'likes']),
      commentCounter: pickNumber(record, ['comment_counter', 'commentCounter', 'num_comments', 'comments']),
      repostCounter: pickNumber(record, ['repost_counter', 'repostCounter', 'num_reposts', 'reposts', 'shares']),
      shareUrl,
      engagerSlugs: [],
    });
  }
  return Array.from(byId.values());
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

const HEADER_SYNONYMS: { field: keyof RawPersonRow; keys: string[] }[] = [
  { field: 'urn', keys: ['profileurnid', 'profileurn', 'urnid', 'urn', 'personurn'] },
  { field: 'fullName', keys: ['fullname', 'name', 'personname', 'profilename'] },
  { field: 'firstName', keys: ['firstname'] },
  { field: 'lastName', keys: ['lastname'] },
  { field: 'linkedinUrl', keys: ['linkedinurl', 'linkedinprofileurl', 'profileurl', 'profilelink', 'linkedin'] },
  { field: 'headline', keys: ['headline'] },
  { field: 'title', keys: ['title', 'jobtitle', 'currenttitle', 'role', 'position'] },
  { field: 'seniorityRaw', keys: ['senioritylevel', 'seniority'] },
  { field: 'decisionMakerRaw', keys: ['isdecisionmaker', 'decisionmaker'] },
  { field: 'companyName', keys: ['companyname', 'currentcompany', 'company', 'employer'] },
  { field: 'companyUrl', keys: ['companyurl', 'companylinkedinurl', 'companylink'] },
  { field: 'location', keys: ['location', 'city', 'geolocation'] },
  { field: 'country', keys: ['country'] },
  { field: 'connectionDegree', keys: ['connectiondegree', 'degree', 'connectionlevel', 'distance'] },
  { field: 'followersCount', keys: ['followerscount', 'followercount', 'followers', 'numfollowers'] },
  { field: 'connectionsCount', keys: ['connectionscount', 'connectioncount', 'connections', 'numconnections'] },
  { field: 'relationshipType', keys: ['relationshiptype', 'relationship', 'employeetype'] },
  { field: 'reactionType', keys: ['reactiontype', 'reaction', 'engagementtype'] },
  { field: 'postUrl', keys: ['posturl', 'postlink'] },
  { field: 'postUrn', keys: ['posturn', 'activityurn', 'activityid', 'postid'] },
  { field: 'postSnippet', keys: ['postsnippet', 'posttext', 'snippet', 'postcontent'] },
  { field: 'targetCompany', keys: ['targetcompany'] },
  { field: 'avatarUrl', keys: ['avatarurl', 'avatar', 'profilepictureurl', 'profilepicture', 'profileimage', 'profilepic', 'photo', 'picture', 'imageurl'] },
];

function buildHeaderMap(cells: unknown[]): Partial<Record<keyof RawPersonRow, number>> | null {
  if (cells.some((cell) => typeof cell === 'string' && cell.includes('linkedin.com'))) return null;
  const normalized = cells.map((cell) => (typeof cell === 'string' ? normalizeKey(cell) : ''));
  const map: Partial<Record<keyof RawPersonRow, number>> = {};
  const used = new Set<number>();
  let matches = 0;
  for (const { field, keys } of HEADER_SYNONYMS) {
    let found = -1;
    for (const key of keys) {
      const idx = normalized.findIndex((n, i) => !used.has(i) && n === key);
      if (idx >= 0) {
        found = idx;
        break;
      }
    }
    if (found === -1) {
      for (const key of keys) {
        if (key.length < 5) continue;
        const idx = normalized.findIndex((n, i) => !used.has(i) && n.length > 0 && n.includes(key));
        if (idx >= 0) {
          found = idx;
          break;
        }
      }
    }
    if (found >= 0) {
      map[field] = found;
      used.add(found);
      matches += 1;
    }
  }
  return matches >= 4 ? map : null;
}

function rowFromArray(cells: unknown[]): RawPersonRow {
  const at = (index: number): string => asString(cells[index]);
  const numAt = (index: number): number => asNumber(cells[index]);
  return {
    urn: at(0),
    fullName: at(1),
    firstName: at(2),
    lastName: at(3),
    linkedinUrl: at(4),
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
    avatarUrl: at(27),
  };
}

function rowFromHeadered(cells: unknown[], map: Partial<Record<keyof RawPersonRow, number>>): RawPersonRow {
  const str = (field: keyof RawPersonRow): string => {
    const idx = map[field];
    return idx === undefined ? '' : asString(cells[idx]);
  };
  const num = (field: keyof RawPersonRow): number => {
    const idx = map[field];
    return idx === undefined ? 0 : asNumber(cells[idx]);
  };
  return {
    urn: str('urn'),
    fullName: str('fullName'),
    firstName: str('firstName'),
    lastName: str('lastName'),
    linkedinUrl: str('linkedinUrl'),
    headline: str('headline'),
    title: str('title'),
    seniorityRaw: str('seniorityRaw'),
    decisionMakerRaw: str('decisionMakerRaw'),
    companyName: str('companyName'),
    companyUrl: str('companyUrl'),
    location: str('location'),
    country: str('country'),
    connectionDegree: str('connectionDegree'),
    followersCount: num('followersCount'),
    connectionsCount: num('connectionsCount'),
    relationshipType: str('relationshipType'),
    reactionType: str('reactionType'),
    postUrl: str('postUrl'),
    postUrn: str('postUrn'),
    postSnippet: str('postSnippet'),
    targetCompany: str('targetCompany'),
    avatarUrl: str('avatarUrl'),
  };
}

const REACTION_WORDS =
  /^(like|praise|empathy|appreciation|interest|entertainment|love|celebrate|support|funny|insightful|curious|comment)$/i;

function normalizeDegree(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return '';
  if (/^(1|1st|first|distance_1)$/.test(v)) return '1st';
  if (/^(2|2nd|second|distance_2)$/.test(v)) return '2nd';
  if (/^(3|3rd|third|distance_3|3\+)$/.test(v)) return '3rd';
  if (/out.?of.?network/.test(v)) return 'Out of network';
  return value.trim();
}

function truthy(value: string): boolean {
  return /^(true|yes|y|1)$/i.test(value.trim());
}

function slugForRow(row: RawPersonRow): string {
  const url = row.linkedinUrl.trim();
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (match) return match[1].toLowerCase();
  const urn = row.urn.trim();
  if (urn) return urn.toLowerCase();
  const name = normalizeName(row.fullName || `${row.firstName} ${row.lastName}`);
  return name;
}

function ingestRow(row: RawPersonRow, acc: ParseAccumulator): void {
  const fullName = row.fullName.trim() || `${row.firstName} ${row.lastName}`.trim();
  const slug = slugForRow(row);
  if (!slug) return;
  if (!fullName && !isHttpUrl(row.linkedinUrl)) return;

  const seniority = classifySeniority(row.seniorityRaw, row.title, row.headline);
  const relationship = row.relationshipType.trim().toLowerCase();
  const isInternal = /(employee|internal|colleague|team member|staff)/.test(relationship);
  const reactionRaw = row.reactionType.trim();
  const reactionType = reactionRaw && REACTION_WORDS.test(reactionRaw) ? reactionRaw.toUpperCase() : reactionRaw ? reactionRaw.toUpperCase() : 'LIKE';

  const postKeySource = row.postUrn.trim() || row.postUrl.trim();
  const interaction: PersonInteraction | null = postKeySource
    ? {
        postKey: extractActivityId(postKeySource),
        postUrl: isHttpUrl(row.postUrl) ? row.postUrl.trim() : '',
        postSnippet: row.postSnippet.trim(),
        reactionType,
      }
    : null;

  let person = acc.peopleBySlug.get(slug);
  if (!person) {
    person = {
      slug,
      fullName,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      linkedinUrl: isHttpUrl(row.linkedinUrl) ? row.linkedinUrl.trim() : '',
      headline: row.headline.trim(),
      title: row.title.trim(),
      seniorityRaw: row.seniorityRaw.trim(),
      seniority,
      isDecisionMaker: row.decisionMakerRaw.trim()
        ? truthy(row.decisionMakerRaw)
        : seniority === 'C-Level' || seniority === 'Director',
      companyName: row.companyName.trim(),
      companyUrl: isHttpUrl(row.companyUrl) ? row.companyUrl.trim() : '',
      location: row.location.trim(),
      country: row.country.trim(),
      connectionDegree: normalizeDegree(row.connectionDegree),
      followersCount: row.followersCount,
      connectionsCount: row.connectionsCount,
      relationshipType: row.relationshipType.trim(),
      isInternal,
      avatarUrl: isHttpUrl(row.avatarUrl) ? row.avatarUrl.trim() : '',
      targetCompany: row.targetCompany.trim(),
      interactions: [],
      engagementCount: 0,
    };
    acc.peopleBySlug.set(slug, person);
  } else {
    if (!person.avatarUrl && isHttpUrl(row.avatarUrl)) person.avatarUrl = row.avatarUrl.trim();
    if (!person.headline && row.headline.trim()) person.headline = row.headline.trim();
    if (!person.title && row.title.trim()) person.title = row.title.trim();
    if (!person.companyName && row.companyName.trim()) person.companyName = row.companyName.trim();
    if (!person.companyUrl && isHttpUrl(row.companyUrl)) person.companyUrl = row.companyUrl.trim();
    if (!person.location && row.location.trim()) person.location = row.location.trim();
    if (!person.country && row.country.trim()) person.country = row.country.trim();
    if (!person.linkedinUrl && isHttpUrl(row.linkedinUrl)) person.linkedinUrl = row.linkedinUrl.trim();
    if (person.followersCount === 0 && row.followersCount > 0) person.followersCount = row.followersCount;
    if (person.connectionsCount === 0 && row.connectionsCount > 0) person.connectionsCount = row.connectionsCount;
  }

  if (interaction) {
    const exists = person.interactions.some(
      (i) => i.postKey === interaction.postKey && i.reactionType === interaction.reactionType
    );
    if (!exists) {
      person.interactions.push(interaction);
      acc.engagements.push({
        postKey: interaction.postKey,
        personSlug: slug,
        engagementType: interaction.reactionType === 'COMMENT' ? 'comment' : 'reaction',
        reactionType: interaction.reactionType,
      });
    }
  }
  person.engagementCount = Math.max(person.interactions.length, 1);
}

function ingestTable(rows: unknown[][], acc: ParseAccumulator): void {
  if (rows.length === 0) return;
  const headerMap = buildHeaderMap(rows[0]);
  const dataRows = headerMap ? rows.slice(1) : rows;
  for (const cells of dataRows) {
    const row = headerMap ? rowFromHeadered(cells, headerMap) : rowFromArray(cells);
    ingestRow(row, acc);
  }
}

function looksLikePersonRecord(record: UnknownRecord): boolean {
  const keys = Object.keys(record).map(normalizeKey);
  const hasName =
    keys.includes('fullname') || (keys.includes('firstname') && keys.includes('lastname'));
  if (hasName) return true;
  const linkedin = pickString(record, ['linkedin_url', 'linkedinurl', 'profile_url', 'profileurl']);
  return /linkedin\.com\/in\//i.test(linkedin);
}

function looksLikePostRecord(record: UnknownRecord): boolean {
  const keys = Object.keys(record).map(normalizeKey);
  return keys.some((k) =>
    ['shareurl', 'reactioncounter', 'commentcounter', 'repostcounter', 'commentary', 'parseddatetime', 'numreactions'].includes(k)
  );
}

function looksLikeCompanyRecord(record: UnknownRecord): boolean {
  const keys = Object.keys(record).map(normalizeKey);
  return keys.some((k) =>
    ['followercount', 'followerscount', 'employeecount', 'staffcount', 'tagline', 'industry', 'universalname'].includes(k)
  );
}

function ingestPersonRecord(record: UnknownRecord, acc: ParseAccumulator): void {
  const row: RawPersonRow = {
    urn: pickString(record, ['profile_urn_id', 'profile_urn', 'urn_id', 'urn', 'person_urn', 'member_id', 'id']),
    fullName: pickString(record, ['full_name', 'fullname', 'name', 'person_name', 'profile_name']),
    firstName: pickString(record, ['first_name', 'firstname']),
    lastName: pickString(record, ['last_name', 'lastname']),
    linkedinUrl: pickString(record, ['linkedin_url', 'linkedin_profile_url', 'profile_url', 'profile_link', 'linkedin']),
    headline: pickString(record, ['headline']),
    title: pickString(record, ['title', 'job_title', 'current_title', 'role', 'position']),
    seniorityRaw: pickString(record, ['seniority_level', 'seniority']),
    decisionMakerRaw: pickString(record, ['is_decision_maker', 'decision_maker']),
    companyName: pickString(record, ['company_name', 'current_company', 'company', 'employer']),
    companyUrl: pickString(record, ['company_url', 'company_linkedin_url', 'company_link']),
    location: pickString(record, ['location', 'city', 'geo_location']),
    country: pickString(record, ['country']),
    connectionDegree: pickString(record, ['connection_degree', 'degree', 'connection_level', 'distance']),
    followersCount: pickNumber(record, ['followers_count', 'follower_count', 'followers', 'num_followers']),
    connectionsCount: pickNumber(record, ['connections_count', 'connection_count', 'connections', 'num_connections']),
    relationshipType: pickString(record, ['relationship_type', 'relationship', 'employee_type']),
    reactionType: pickString(record, ['reaction_type', 'reaction', 'engagement_type']),
    postUrl: pickString(record, ['post_url', 'post_link']),
    postUrn: pickString(record, ['post_urn', 'activity_urn', 'activity_id', 'post_id']),
    postSnippet: pickString(record, ['post_snippet', 'post_text', 'snippet', 'post_content']),
    targetCompany: pickString(record, ['target_company']),
    avatarUrl: pickString(record, ['avatar_url', 'avatar', 'profile_picture_url', 'profile_picture', 'profile_image', 'photo', 'picture', 'image_url']),
  };
  ingestRow(row, acc);
}

function ingestPostRecord(record: UnknownRecord, acc: ParseAccumulator): void {
  for (const post of parsePosts([record])) {
    if (!acc.postsById.has(post.id)) acc.postsById.set(post.id, post);
  }
}

function walk(value: unknown, acc: ParseAccumulator, depth: number): void {
  if (depth > 10) return;
  const decoded = deepDecode(value);
  if (Array.isArray(decoded)) {
    if (decoded.length > 0 && decoded.every((row) => Array.isArray(row))) {
      ingestTable(decoded as unknown[][], acc);
      return;
    }
    for (const entry of decoded) {
      walk(entry, acc, depth + 1);
    }
    return;
  }
  if (!isRecord(decoded)) return;
  if (looksLikePersonRecord(decoded)) {
    ingestPersonRecord(decoded, acc);
    return;
  }
  if (looksLikePostRecord(decoded)) {
    ingestPostRecord(decoded, acc);
    return;
  }
  if (!acc.company && looksLikeCompanyRecord(decoded)) {
    const company = parseCompanyProfile(decoded);
    if (company) acc.company = company;
  }
  for (const entry of Object.values(decoded)) {
    walk(entry, acc, depth + 1);
  }
}

/**
 * Parses an intelligence workflow payload of unknown shape into DashboardData.
 * Handles JSON-encoded strings, nested containers, spreadsheet-style row arrays
 * and keyed record objects for company, posts and people.
 */
export function parseWorkflowResponse(raw: unknown): DashboardData {
  const acc: ParseAccumulator = {
    company: null,
    postsById: new Map<string, PostItem>(),
    peopleBySlug: new Map<string, Person>(),
    engagements: [],
  };

  const decoded = deepDecode(raw);

  if (isRecord(decoded)) {
    const companyRaw = decoded.company ?? decoded.company_profile ?? decoded.companyProfile;
    if (companyRaw !== undefined) {
      const company = parseCompanyProfile(companyRaw);
      if (company) acc.company = company;
    }
    const postsRaw = decoded.posts ?? decoded.post_list ?? decoded.postList;
    if (postsRaw !== undefined) {
      for (const post of parsePosts(postsRaw)) {
        if (!acc.postsById.has(post.id)) acc.postsById.set(post.id, post);
      }
    }
  }

  walk(decoded, acc, 0);

  const posts = Array.from(acc.postsById.values());
  const people = Array.from(acc.peopleBySlug.values());

  const postByActivity = new Map<string, PostItem>();
  for (const post of posts) {
    postByActivity.set(post.activityKey, post);
  }
  for (const person of people) {
    for (const interaction of person.interactions) {
      const post = postByActivity.get(interaction.postKey);
      if (post && !post.engagerSlugs.includes(person.slug)) {
        post.engagerSlugs.push(person.slug);
      }
    }
  }

  people.sort((a, b) => b.engagementCount - a.engagementCount);

  return {
    company: acc.company,
    posts,
    people,
    engagements: acc.engagements,
  };
}
