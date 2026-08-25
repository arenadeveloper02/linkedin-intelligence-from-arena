import type {
  CompanyProfile,
  DashboardData,
  EngagementRecord,
  Person,
  PersonInteraction,
  PostItem,
} from './types';
import { classifySeniority } from './utils';
import { flattenProfileLayers, isCompanyProfileNode } from './profile-details';

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
  // Personal rows nest a UserProfile under company_profile with is_company "false".
  if (!isCompanyProfileNode(decoded)) return null;
  const merged: UnknownRecord = {};
  for (const layer of flattenProfileLayers(decoded)) {
    Object.assign(merged, layer);
  }
  const name = pickString(merged, ['name', 'company_name', 'companyName', 'universal_name', 'universalName']);
  let logoUrl = pickString(merged, ['logo', 'logo_large', 'logo_url', 'logoUrl', 'image', 'image_url']);
  if (!isHttpUrl(logoUrl)) logoUrl = '';
  const followerCount = pickNumber(merged, ['follower_count', 'followers_count', 'followers', 'followerCount']);
  const tagline = pickString(merged, ['tagline']) || pickString(merged, ['description', 'about', 'summary']);
  const employeeCount = pickNumber(merged, ['employee_count', 'employees', 'staff_count', 'employeeCount', 'staffCount']);
  const industry = pickString(merged, ['industry', 'industries']);
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

const SYNONYM_MAP = new Map<keyof RawPersonRow, string[]>(HEADER_SYNONYMS.map((h) => [h.field, h.keys]));

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

function rowFromRecord(record: UnknownRecord): RawPersonRow {
  const str = (field: keyof RawPersonRow): string => pickString(record, SYNONYM_MAP.get(field) ?? []);
  const num = (field: keyof RawPersonRow): number => pickNumber(record, SYNONYM_MAP.get(field) ?? []);
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

function parseBoolean(value: string): boolean {
  return /^(true|yes|y|1)$/i.test(value.trim());
}

function slugFromLinkedInUrl(url: string): string {
  const match = url.match(/linkedin\.com\/(?:in|company|school)\/([^/?#]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]).replace(/\/+$/, '').toLowerCase();
    } catch {
      return match[1].replace(/\/+$/, '').toLowerCase();
    }
  }
  return '';
}

function personSlug(row: RawPersonRow): string {
  const fromUrl = slugFromLinkedInUrl(row.linkedinUrl);
  if (fromUrl) return fromUrl;
  const urn = row.urn.trim();
  if (urn) return urn.toLowerCase();
  return normalizeName(row.fullName || `${row.firstName} ${row.lastName}`);
}

function computeIsInternal(row: RawPersonRow): boolean {
  const rel = row.relationshipType.trim().toLowerCase();
  if (/(internal|employee|staff)/.test(rel)) return true;
  const company = normalizeName(row.companyName);
  const target = normalizeName(row.targetCompany);
  if (company && target && company.length >= 3 && target.length >= 3) {
    if (company === target || company.includes(target) || target.includes(company)) return true;
  }
  return false;
}

// Cap stored snippet length so thousands of expanded engagement records do not
// balloon client memory during state hydration.
const MAX_SNIPPET_LENGTH = 600;

function normalizeReaction(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (REACTION_WORDS.test(trimmed)) return trimmed.toUpperCase();
  // Preserve unknown but plausible reaction labels; ignore obvious non-reaction cells.
  if (/^[a-z_ -]{2,24}$/i.test(trimmed)) return trimmed.toUpperCase();
  return '';
}

function ingestPersonRow(
  acc: ParseAccumulator,
  engagerSets: Map<string, Set<string>>,
  row: RawPersonRow
): boolean {
  const fullName = (row.fullName || `${row.firstName} ${row.lastName}`).trim();
  if (!row.urn.trim() && !row.linkedinUrl.trim() && !fullName) return false;
  const slug = personSlug(row);
  if (!slug) return false;
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
      seniority: classifySeniority(row.seniorityRaw, row.title, row.headline),
      isDecisionMaker: parseBoolean(row.decisionMakerRaw),
      companyName: row.companyName.trim(),
      companyUrl: isHttpUrl(row.companyUrl) ? row.companyUrl.trim() : '',
      location: row.location.trim(),
      country: row.country.trim(),
      connectionDegree: normalizeDegree(row.connectionDegree),
      followersCount: row.followersCount,
      connectionsCount: row.connectionsCount,
      relationshipType: row.relationshipType.trim(),
      isInternal: computeIsInternal(row),
      avatarUrl: isHttpUrl(row.avatarUrl) ? row.avatarUrl.trim() : '',
      targetCompany: row.targetCompany.trim(),
      interactions: [],
      engagementCount: 0,
    };
    acc.peopleBySlug.set(slug, person);
  } else {
    // Fill any fields that were missing on earlier rows for the same person —
    // never throw when a row omits location, country or other optional fields.
    if (!person.fullName && fullName) person.fullName = fullName;
    if (!person.headline && row.headline.trim()) person.headline = row.headline.trim();
    if (!person.title && row.title.trim()) person.title = row.title.trim();
    if (!person.companyName && row.companyName.trim()) person.companyName = row.companyName.trim();
    if (!person.companyUrl && isHttpUrl(row.companyUrl)) person.companyUrl = row.companyUrl.trim();
    if (!person.avatarUrl && isHttpUrl(row.avatarUrl)) person.avatarUrl = row.avatarUrl.trim();
    if (!person.linkedinUrl && isHttpUrl(row.linkedinUrl)) person.linkedinUrl = row.linkedinUrl.trim();
    if (!person.location && row.location.trim()) person.location = row.location.trim();
    if (!person.country && row.country.trim()) person.country = row.country.trim();
    if (!person.connectionDegree && row.connectionDegree.trim()) person.connectionDegree = normalizeDegree(row.connectionDegree);
    if (person.followersCount === 0 && row.followersCount > 0) person.followersCount = row.followersCount;
    if (person.connectionsCount === 0 && row.connectionsCount > 0) person.connectionsCount = row.connectionsCount;
    if (person.seniority === 'Unknown') {
      const reclassified = classifySeniority(row.seniorityRaw, row.title, row.headline);
      if (reclassified !== 'Unknown') person.seniority = reclassified;
    }
    if (!person.isDecisionMaker && parseBoolean(row.decisionMakerRaw)) person.isDecisionMaker = true;
    if (!person.isInternal && computeIsInternal(row)) person.isInternal = true;
  }
  const postKeySource = (row.postUrn || row.postUrl).trim();
  if (postKeySource) {
    const postKey = extractActivityId(postKeySource);
    const reactionType = normalizeReaction(row.reactionType) || 'LIKE';
    const rawSnippet = row.postSnippet;
    const snippet =
      rawSnippet.length > MAX_SNIPPET_LENGTH ? `${rawSnippet.slice(0, MAX_SNIPPET_LENGTH)}…` : rawSnippet;
    const duplicate = person.interactions.some(
      (existing) => existing.postKey === postKey && existing.reactionType === reactionType
    );
    if (!duplicate) {
      const interaction: PersonInteraction = {
        postKey,
        postUrl: isHttpUrl(row.postUrl) ? row.postUrl.trim() : '',
        postSnippet: snippet,
        reactionType,
      };
      person.interactions.push(interaction);
      person.engagementCount += 1;
      acc.engagements.push({
        postKey,
        personSlug: slug,
        engagementType: /comment/i.test(row.reactionType) ? 'comment' : 'reaction',
        reactionType,
      });
      // O(1) engager de-duplication via Sets instead of repeated Array.includes
      // scans — keeps large payload hydration off the slow path.
      let engagers = engagerSets.get(postKey);
      if (!engagers) {
        engagers = new Set<string>();
        engagerSets.set(postKey, engagers);
      }
      engagers.add(slug);
    }
  }
  return true;
}

function ingestPeopleValue(
  raw: unknown,
  acc: ParseAccumulator,
  engagerSets: Map<string, Set<string>>
): number {
  const decoded = deepDecode(raw);
  let items: unknown[] = [];
  if (Array.isArray(decoded)) {
    items = decoded;
  } else if (isRecord(decoded)) {
    const inner = deepDecode(decoded.values ?? decoded.rows ?? decoded.items ?? decoded.data);
    if (Array.isArray(inner)) items = inner;
  }
  if (items.length === 0) return 0;
  let ingested = 0;
  let headerMap: Partial<Record<keyof RawPersonRow, number>> | null = null;
  for (const entry of items) {
    // Each entry may itself be a double-encoded JSON array/object string
    // (e.g. users_profile_data.values); decode it exactly once per row.
    const rowValue = deepDecode(entry);
    if (Array.isArray(rowValue)) {
      if (headerMap === null) {
        const maybeHeader = buildHeaderMap(rowValue);
        if (maybeHeader) {
          headerMap = maybeHeader;
          continue;
        }
      }
      const row = headerMap ? rowFromHeadered(rowValue, headerMap) : rowFromArray(rowValue);
      if (ingestPersonRow(acc, engagerSets, row)) ingested += 1;
      continue;
    }
    if (isRecord(rowValue)) {
      const row = rowFromRecord(rowValue);
      if (ingestPersonRow(acc, engagerSets, row)) ingested += 1;
    }
  }
  return ingested;
}

const MAX_WALK_DEPTH = 10;

const PEOPLE_KEY_PATTERN = /(profiledata|usersprofile|people|person|engager|engagement)/;
const POST_KEY_PATTERN = /post/;

function walk(
  node: unknown,
  acc: ParseAccumulator,
  engagerSets: Map<string, Set<string>>,
  depth: number
): void {
  if (depth > MAX_WALK_DEPTH) return;
  const decoded = deepDecode(node);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      if (item === null || item === undefined) continue;
      walk(item, acc, engagerSets, depth + 1);
    }
    return;
  }
  if (!isRecord(decoded)) return;
  for (const [key, rawInner] of Object.entries(decoded)) {
    if (rawInner === null || rawInner === undefined) continue;
    const normalized = normalizeKey(key);
    // Decode each branch a single time so large double-encoded strings are not
    // re-parsed by every candidate section handler below.
    const inner = deepDecode(rawInner);
    if (!acc.company && (normalized === 'companyprofile' || normalized === 'company' || normalized === 'companydetails')) {
      const company = parseCompanyProfile(inner);
      if (company) {
        acc.company = company;
        continue;
      }
    }
    if (POST_KEY_PATTERN.test(normalized) && !PEOPLE_KEY_PATTERN.test(normalized)) {
      const parsedPosts = parsePosts(inner);
      if (parsedPosts.length > 0) {
        for (const post of parsedPosts) {
          if (!acc.postsById.has(post.id)) acc.postsById.set(post.id, post);
        }
        continue;
      }
    }
    if (PEOPLE_KEY_PATTERN.test(normalized)) {
      const ingested = ingestPeopleValue(inner, acc, engagerSets);
      if (ingested > 0) continue;
    }
    if (typeof inner === 'string') continue;
    walk(inner, acc, engagerSets, depth + 1);
  }
}

export function parseWorkflowResponse(raw: unknown): DashboardData {
  const acc: ParseAccumulator = {
    company: null,
    postsById: new Map<string, PostItem>(),
    peopleBySlug: new Map<string, Person>(),
    engagements: [],
  };
  const engagerSets = new Map<string, Set<string>>();
  walk(raw, acc, engagerSets, 0);
  const posts = Array.from(acc.postsById.values());
  for (const post of posts) {
    const engagers = engagerSets.get(post.activityKey);
    if (engagers) post.engagerSlugs = Array.from(engagers);
  }
  return {
    company: acc.company,
    posts,
    people: Array.from(acc.peopleBySlug.values()),
    engagements: acc.engagements,
  };
}
