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

function applyCellHeuristics(row: RawPersonRow, cells: unknown[]): RawPersonRow {
  if (!row.linkedinUrl.includes('linkedin.com/in')) {
    const found = cells.find((cell) => typeof cell === 'string' && cell.includes('linkedin.com/in'));
    if (typeof found === 'string') row.linkedinUrl = found;
  }
  if (!isHttpUrl(row.postUrl) || !row.postUrl.includes('linkedin.com')) {
    const found = cells.find(
      (cell) =>
        typeof cell === 'string' &&
        isHttpUrl(cell) &&
        cell.includes('linkedin.com') &&
        !cell.includes('linkedin.com/in') &&
        !cell.includes('linkedin.com/company') &&
        (cell.includes('/posts/') || cell.includes('/feed/update') || cell.includes('activity'))
    );
    if (typeof found === 'string') row.postUrl = found;
  }
  if (!isHttpUrl(row.avatarUrl)) {
    const found = cells.find(
      (cell) =>
        typeof cell === 'string' &&
        isHttpUrl(cell) &&
        (cell.includes('licdn') || cell.includes('media') || cell.includes('avatar'))
    );
    if (typeof found === 'string') row.avatarUrl = found;
  }
  if (!row.postUrn) {
    const found = cells.find((cell) => typeof cell === 'string' && /urn:li:(activity|ugcPost|share):\d+/.test(cell));
    if (typeof found === 'string') row.postUrn = found;
  }
  return row;
}

function sanitizeRow(row: RawPersonRow): RawPersonRow {
  if (!isHttpUrl(row.linkedinUrl)) row.linkedinUrl = '';
  if (!isHttpUrl(row.companyUrl)) row.companyUrl = '';
  if (!isHttpUrl(row.postUrl)) row.postUrl = '';
  if (!isHttpUrl(row.avatarUrl)) row.avatarUrl = '';
  return row;
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
    location: pickString(record, ['location', 'city', 'geo']),
    country: pickString(record, ['country']),
    connectionDegree: pickString(record, ['connection_degree', 'connectionDegree', 'degree']),
    followersCount: pickNumber(record, ['followers_count', 'followersCount', 'followers', 'follower_count']),
    connectionsCount: pickNumber(record, ['connections_count', 'connectionsCount', 'connections', 'connection_count']),
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
  if (row.linkedinUrl.includes('linkedin.com')) {
    const cleaned = row.linkedinUrl.split('?')[0].replace(/\/+$/, '');
    const segments = cleaned.split('/');
    const last = segments[segments.length - 1];
    if (last && last.toLowerCase() !== 'in') return last.toLowerCase();
  }
  if (row.urn) return row.urn;
  const name = row.fullName.trim().toLowerCase().replace(/\s+/g, '-');
  if (!name) return 'unknown';
  const company = row.companyName.trim().toLowerCase().replace(/\s+/g, '-');
  return company ? `${name}--${company}` : name;
}

function isYes(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === 'y';
}

function computeInternal(row: RawPersonRow): boolean {
  const rel = row.relationshipType.toLowerCase();
  if (rel.includes('employee') || rel.includes('internal')) return true;
  if (rel.includes('external')) return false;
  const companyName = normalizeName(row.companyName);
  const target = normalizeName(row.targetCompany);
  if (!companyName || !target) return false;
  return companyName === target || companyName.includes(target) || target.includes(companyName);
}

function toInteraction(row: RawPersonRow): PersonInteraction | null {
  const postUrl = isHttpUrl(row.postUrl) ? row.postUrl : '';
  if (!row.postUrn && !postUrl && !row.reactionType) return null;
  return {
    postKey: extractActivityId(row.postUrn || postUrl),
    postUrl,
    postSnippet: row.postSnippet,
    reactionType: (row.reactionType || 'LIKE').toUpperCase(),
  };
}

function fillPersonGaps(person: Person, row: RawPersonRow): void {
  if (!person.avatarUrl && row.avatarUrl) person.avatarUrl = row.avatarUrl;
  if (!person.headline && row.headline) person.headline = row.headline;
  if (!person.title && row.title) person.title = row.title;
  if (!person.companyName && row.companyName) person.companyName = row.companyName;
  if (!person.companyUrl && row.companyUrl) person.companyUrl = row.companyUrl;
  if (!person.location && row.location) person.location = row.location;
  if (!person.country && row.country) person.country = row.country;
  if (!person.connectionDegree && row.connectionDegree) person.connectionDegree = row.connectionDegree;
  if (!person.linkedinUrl && row.linkedinUrl) person.linkedinUrl = row.linkedinUrl;
  if (person.followersCount === 0 && row.followersCount > 0) person.followersCount = row.followersCount;
  if (person.connectionsCount === 0 && row.connectionsCount > 0) person.connectionsCount = row.connectionsCount;
  if (!person.relationshipType && row.relationshipType) person.relationshipType = row.relationshipType;
  if (!person.targetCompany && row.targetCompany) person.targetCompany = row.targetCompany;
  if (!person.isDecisionMaker && isYes(row.decisionMakerRaw)) person.isDecisionMaker = true;
  if (!person.isInternal && computeInternal(row)) person.isInternal = true;
  if (person.seniority === 'Unknown') {
    const level = classifySeniority(row.seniorityRaw, row.title, row.headline);
    if (level !== 'Unknown') person.seniority = level;
  }
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
  let headerMap: Partial<Record<keyof RawPersonRow, number>> | null = null;
  const map = new Map<string, Person>();
  for (let index = 0; index < values.length; index += 1) {
    const decodedRow = deepDecode(values[index]);
    let row: RawPersonRow | null = null;
    if (Array.isArray(decodedRow)) {
      if (index === 0) {
        headerMap = buildHeaderMap(decodedRow);
        if (headerMap) continue;
      }
      row = headerMap
        ? applyCellHeuristics(rowFromHeadered(decodedRow, headerMap), decodedRow)
        : applyCellHeuristics(rowFromArray(decodedRow), decodedRow);
    } else if (isRecord(decodedRow)) {
      row = rowFromRecord(decodedRow);
    }
    if (!row) continue;
    sanitizeRow(row);
    if (!row.fullName && !row.urn && !row.linkedinUrl) continue;
    const normalizedName = normalizeKey(row.fullName);
    if (normalizedName === 'fullname' || normalizedName === 'name') continue;
    const slug = slugForRow(row);
    const interaction = toInteraction(row);
    const existing = map.get(slug);
    if (existing) {
      if (interaction) {
        const duplicate =
          interaction.postKey !== '' &&
          existing.interactions.some(
            (i) => i.postKey === interaction.postKey && i.reactionType === interaction.reactionType
          );
        if (!duplicate) {
          existing.interactions.push(interaction);
          existing.engagementCount += 1;
        }
      }
      fillPersonGaps(existing, row);
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

function classifyArray(items: unknown[]): 'people' | 'posts' | 'unknown' {
  const personRecordKeys = [
    'fullname',
    'firstname',
    'lastname',
    'linkedinurl',
    'profileurl',
    'profileurnid',
    'headline',
    'senioritylevel',
    'isdecisionmaker',
    'reactiontype',
    'connectiondegree',
  ];
  const postRecordKeys = [
    'shareurl',
    'commentary',
    'reactioncounter',
    'numreactions',
    'commentcounter',
    'numcomments',
    'repostcounter',
    'parseddatetime',
    'postedat',
  ];
  for (const item of items.slice(0, 8)) {
    const decoded = deepDecode(item);
    if (Array.isArray(decoded)) {
      const joined = decoded.filter((c): c is string => typeof c === 'string').join(' ').toLowerCase();
      if (joined.includes('linkedin.com/in')) return 'people';
      const normalizedCells = decoded.map((c) => (typeof c === 'string' ? normalizeKey(c) : ''));
      if (normalizedCells.includes('fullname') || normalizedCells.includes('linkedinurl')) return 'people';
    } else if (isRecord(decoded)) {
      const keys = Object.keys(decoded).map(normalizeKey);
      const personHits = keys.filter((k) => personRecordKeys.includes(k)).length;
      if (personHits >= 2) return 'people';
      const postHits = keys.filter((k) => postRecordKeys.includes(k)).length;
      if (postHits >= 2) return 'posts';
    }
  }
  return 'unknown';
}

function mergePeople(acc: ParseAccumulator, incoming: Person[]): void {
  for (const person of incoming) {
    const existing = acc.peopleBySlug.get(person.slug);
    if (!existing) {
      acc.peopleBySlug.set(person.slug, person);
      continue;
    }
    for (const interaction of person.interactions) {
      const duplicate =
        interaction.postKey !== '' &&
        existing.interactions.some(
          (i) => i.postKey === interaction.postKey && i.reactionType === interaction.reactionType
        );
      if (!duplicate) existing.interactions.push(interaction);
    }
    if (!existing.avatarUrl) existing.avatarUrl = person.avatarUrl;
    if (!existing.headline) existing.headline = person.headline;
    if (!existing.title) existing.title = person.title;
    if (!existing.companyName) existing.companyName = person.companyName;
    if (!existing.companyUrl) existing.companyUrl = person.companyUrl;
    if (!existing.location) existing.location = person.location;
    if (!existing.country) existing.country = person.country;
    if (!existing.connectionDegree) existing.connectionDegree = person.connectionDegree;
    if (!existing.linkedinUrl) existing.linkedinUrl = person.linkedinUrl;
    if (existing.followersCount === 0) existing.followersCount = person.followersCount;
    if (existing.connectionsCount === 0) existing.connectionsCount = person.connectionsCount;
    if (!existing.relationshipType) existing.relationshipType = person.relationshipType;
    if (!existing.targetCompany) existing.targetCompany = person.targetCompany;
    if (!existing.isDecisionMaker && person.isDecisionMaker) existing.isDecisionMaker = true;
    if (!existing.isInternal && person.isInternal) existing.isInternal = true;
    if (existing.seniority === 'Unknown' && person.seniority !== 'Unknown') existing.seniority = person.seniority;
    existing.engagementCount = Math.max(existing.engagementCount, existing.interactions.length);
  }
}

function mergePosts(acc: ParseAccumulator, incoming: PostItem[]): void {
  for (const post of incoming) {
    const existing = acc.postsById.get(post.id);
    if (!existing) {
      acc.postsById.set(post.id, post);
      continue;
    }
    if (!existing.text && post.text) existing.text = post.text;
    if (!existing.parsedDatetime && post.parsedDatetime) existing.parsedDatetime = post.parsedDatetime;
    if (existing.reactionCounter === 0) existing.reactionCounter = post.reactionCounter;
    if (existing.commentCounter === 0) existing.commentCounter = post.commentCounter;
    if (existing.repostCounter === 0) existing.repostCounter = post.repostCounter;
    if (!existing.shareUrl && post.shareUrl) existing.shareUrl = post.shareUrl;
  }
}

function visit(node: unknown, acc: ParseAccumulator, depth: number): void {
  if (depth > 10 || node === null || node === undefined) return;
  const decoded = deepDecode(node);
  if (Array.isArray(decoded)) {
    const kind = classifyArray(decoded);
    if (kind === 'people') {
      mergePeople(acc, parsePeople(decoded));
      return;
    }
    if (kind === 'posts') {
      mergePosts(acc, parsePosts(decoded));
      return;
    }
    for (const item of decoded) visit(item, acc, depth + 1);
    return;
  }
  if (!isRecord(decoded)) return;
  const companyGateKeys = ['followercount', 'followerscount', 'universalname', 'tagline', 'employeecount', 'staffcount', 'industry'];
  const recordKeys = Object.keys(decoded).map(normalizeKey);
  if (!acc.company && recordKeys.some((k) => companyGateKeys.includes(k))) {
    const candidate = parseCompanyProfile(decoded);
    if (candidate) acc.company = candidate;
  }
  for (const [key, value] of Object.entries(decoded)) {
    const nk = normalizeKey(key);
    if (!acc.company && nk.includes('company')) {
      const candidate = parseCompanyProfile(value);
      if (candidate) {
        acc.company = candidate;
        continue;
      }
    }
    if (nk.includes('post') && !nk.includes('snippet')) {
      const parsedPosts = parsePosts(value);
      if (parsedPosts.length > 0) {
        mergePosts(acc, parsedPosts);
        continue;
      }
    }
    if (
      nk.includes('people') ||
      nk.includes('person') ||
      nk.includes('engager') ||
      nk.includes('sheet') ||
      nk === 'values' ||
      nk === 'rows'
    ) {
      const decodedValue = deepDecode(value);
      const isPostsArray = Array.isArray(decodedValue) && classifyArray(decodedValue) === 'posts';
      if (!isPostsArray) {
        const parsedPeople = parsePeople(decodedValue);
        if (parsedPeople.length > 0) {
          mergePeople(acc, parsedPeople);
          continue;
        }
      }
    }
    visit(value, acc, depth + 1);
  }
}

export function parseWorkflowResponse(raw: unknown): DashboardData {
  const acc: ParseAccumulator = { company: null, postsById: new Map(), peopleBySlug: new Map() };
  visit(raw, acc, 0);

  const people = Array.from(acc.peopleBySlug.values());
  const posts = Array.from(acc.postsById.values());

  for (const person of people) {
    if (person.engagementCount < person.interactions.length) {
      person.engagementCount = person.interactions.length;
    }
    if (person.engagementCount < 1) person.engagementCount = 1;
  }

  const postByKey = new Map<string, PostItem>();
  for (const post of posts) {
    if (post.activityKey && !postByKey.has(post.activityKey)) postByKey.set(post.activityKey, post);
  }
  for (const person of people) {
    for (const interaction of person.interactions) {
      const post = interaction.postKey ? postByKey.get(interaction.postKey) : undefined;
      if (post && !post.engagerSlugs.includes(person.slug)) post.engagerSlugs.push(person.slug);
    }
  }

  const targets = new Set<string>();
  if (acc.company && acc.company.name) targets.add(normalizeName(acc.company.name));
  for (const person of people) {
    const t = normalizeName(person.targetCompany);
    if (t) targets.add(t);
  }
  for (const person of people) {
    if (person.isInternal) continue;
    const companyName = normalizeName(person.companyName);
    if (!companyName) continue;
    for (const target of targets) {
      if (!target) continue;
      if (companyName === target || companyName.includes(target) || target.includes(companyName)) {
        person.isInternal = true;
        break;
      }
    }
  }

  const engagements: EngagementRecord[] = [];
  for (const person of people) {
    for (const interaction of person.interactions) {
      engagements.push({
        postKey: interaction.postKey,
        personSlug: person.slug,
        engagementType: interaction.reactionType === 'COMMENT' ? 'comment' : 'reaction',
        reactionType: interaction.reactionType,
      });
    }
  }

  people.sort((a, b) => b.engagementCount - a.engagementCount);

  return { company: acc.company, posts, people, engagements };
}
