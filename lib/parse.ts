import type {
  CompanyProfile,
  CompanyAggregate,
  DashboardData,
  EngagementRecord,
  Person,
  PersonInteraction,
  PostItem,
} from './types';
import { classifySeniority, activityIdsFrom, cleanCompanyName, isCompanyDisplayName } from './utils';
import { flattenProfileLayers, isCompanyProfileNode } from './profile-details';

type UnknownRecord = Record<string, unknown>;

interface ParseAccumulator {
  company: CompanyProfile | null;
  companiesByKey: Map<string, CompanySummary>;
  companyProfilePeopleBySlug: Map<string, Person>;
  peopleCompanyProfilesBySlug: Map<string, Person>;
  profileImagesByKey: Map<string, string>;
  postsById: Map<string, PostItem>;
  peopleBySlug: Map<string, Person>;
  engagements: EngagementRecord[];
}

interface CompanySummary {
  name: string;
  companyId: string;
  companyUrl: string;
  peopleCount: number;
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

function companyKey(value: string): string {
  return normalizeName(value).replace(/²/g, '2');
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

function imageUrlFromValue(value: unknown): string {
  const decoded = deepDecode(value);
  if (typeof decoded === 'string' && isHttpUrl(decoded)) return decoded.trim();
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const imageUrl = imageUrlFromValue(item);
      if (imageUrl) return imageUrl;
    }
    return '';
  }
  if (!isRecord(decoded)) return '';
  return pickString(decoded, [
    'profile_image',
    'profileImage',
    'profile_images',
    'profileImages',
    'profile_image_url',
    'profileImageUrl',
    'image_url',
    'imageUrl',
    'avatar_url',
    'avatarUrl',
    'url',
    'src',
    'original',
    'large',
  ]);
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

function isLinkedInPostIdentity(id: string, socialId: string, shareUrl: string, activityKey: string): boolean {
  const haystack = `${id} ${socialId} ${shareUrl}`;
  if (/linkedin\.com\/(?:in|company|school)\//i.test(shareUrl) && !/\/(?:posts|feed)\//i.test(shareUrl)) {
    return false;
  }
  if (/urn:li:(?:activity|ugcpost|share):\d{8,}/i.test(haystack)) return true;
  if (/linkedin\.com\/(?:feed\/update|posts\/|pulse\/)/i.test(shareUrl)) return true;
  return /^\d{8,}$/.test(activityKey);
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
    const socialId = pickString(record, ['social_id', 'socialId', 'activity_urn', 'ugc_id']);
    const rawShareUrl = pickString(record, ['share_url', 'shareUrl', 'url', 'post_url', 'link', 'permalink']);
    const activityKey = extractActivityId(id || socialId || rawShareUrl);
    const shareUrl = isHttpUrl(rawShareUrl)
      ? rawShareUrl
      : /^\d{8,}$/.test(activityKey)
        ? `https://www.linkedin.com/feed/update/urn:li:activity:${activityKey}/`
        : '';
    if (!id && !socialId && !rawShareUrl && !shareUrl) continue;
    if (!isLinkedInPostIdentity(id, socialId, shareUrl, activityKey)) continue;
    const key = id || socialId || rawShareUrl || shareUrl;
    if (byId.has(key)) continue;
    byId.set(key, {
      id: key,
      activityKey,
      socialId,
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
  personId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  headline: string;
  title: string;
  seniorityRaw: string;
  decisionMakerRaw: string;
  companyName: string;
  companyIsAuthoritative: boolean;
  companyUrl: string;
  location: string;
  country: string;
  connectionDegree: string;
  followersCount: number;
  connectionsCount: number;
  relationshipType: string;
  reactionType: string;
  commentedRaw: string;
  postUrl: string;
  postUrn: string;
  postSnippet: string;
  targetCompany: string;
  avatarUrl: string;
}

const HEADER_SYNONYMS: { field: keyof RawPersonRow; keys: string[] }[] = [
  { field: 'urn', keys: ['profileurnid', 'profileurn', 'urnid', 'personurn', 'uniquekey'] },
  { field: 'personId', keys: ['personid', 'profileid', 'memberid'] },
  { field: 'fullName', keys: ['personfullname', 'fullname', 'personname', 'profilename'] },
  { field: 'firstName', keys: ['firstname'] },
  { field: 'lastName', keys: ['lastname'] },
  { field: 'linkedinUrl', keys: ['linkedinprofileurl', 'linkedinurl', 'personurl', 'profileurl', 'profilelink'] },
  { field: 'headline', keys: ['headline'] },
  { field: 'title', keys: ['currentjobtitle', 'jobtitle', 'currenttitle', 'title'] },
  { field: 'seniorityRaw', keys: ['senioritybucket', 'senioritylevel', 'seniority'] },
  { field: 'decisionMakerRaw', keys: ['isdecisionmaker', 'decisionmaker'] },
  { field: 'companyName', keys: ['currentcompanyname', 'companyname', 'currentcompany', 'employer'] },
  { field: 'companyUrl', keys: ['currentcompanylinkedinurl', 'companylinkedinurl', 'companyurl', 'companylink'] },
  { field: 'location', keys: ['personlocationregion', 'personlocation', 'geolocation', 'city'] },
  { field: 'country', keys: ['personcountry', 'country'] },
  { field: 'connectionDegree', keys: ['connectiondegree', 'connectionlevel', 'distance'] },
  { field: 'followersCount', keys: ['followerscount', 'followercount', 'numfollowers'] },
  { field: 'connectionsCount', keys: ['connectionscount', 'connectioncount', 'numconnections'] },
  { field: 'relationshipType', keys: ['relationshiptotarget', 'relationshiptype', 'employeetype'] },
  { field: 'reactionType', keys: ['reactiontype', 'engagementtype'] },
  { field: 'commentedRaw', keys: ['commented', 'iscomment'] },
  { field: 'postUrl', keys: ['posturl', 'postlink', 'activityurl', 'linkedinposturl'] },
  { field: 'postUrn', keys: ['postid', 'posturn', 'activityurn', 'activityid'] },
  { field: 'postSnippet', keys: ['postsnippet', 'posttext', 'postcontent'] },
  { field: 'targetCompany', keys: ['postauthortargetcompany', 'targetcompany'] },
  { field: 'avatarUrl', keys: ['profilepictureurl', 'pictureurl', 'avatarurl', 'profilepicture', 'profileimage', 'profileimages'] },
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

function emptyPersonRow(): RawPersonRow {
  return {
    urn: '',
    personId: '',
    fullName: '',
    firstName: '',
    lastName: '',
    linkedinUrl: '',
    headline: '',
    title: '',
    seniorityRaw: '',
    decisionMakerRaw: '',
    companyName: '',
    companyIsAuthoritative: false,
    companyUrl: '',
    location: '',
    country: '',
    connectionDegree: '',
    followersCount: 0,
    connectionsCount: 0,
    relationshipType: '',
    reactionType: '',
    commentedRaw: '',
    postUrl: '',
    postUrn: '',
    postSnippet: '',
    targetCompany: '',
    avatarUrl: '',
  };
}

function rowFromArray(cells: unknown[]): RawPersonRow {
  const at = (index: number): string => asString(cells[index]);
  const numAt = (index: number): number => asNumber(cells[index]);
  const row = emptyPersonRow();
  if (cells.length >= 34) {
    row.urn = at(0);
    row.fullName = at(1);
    row.firstName = at(2);
    row.lastName = at(3);
    row.linkedinUrl = at(4);
    row.personId = at(5);
    row.headline = at(6);
    row.title = at(7);
    row.seniorityRaw = at(8);
    row.decisionMakerRaw = at(9);
    row.companyName = at(10);
    row.companyUrl = at(11);
    row.location = at(17);
    row.country = at(18);
    row.connectionDegree = at(20);
    row.followersCount = numAt(21);
    row.connectionsCount = numAt(22);
    row.relationshipType = at(23);
    row.reactionType = at(25);
    row.commentedRaw = at(26);
    row.postUrl = at(28);
    row.postUrn = at(29);
    row.postSnippet = at(30);
    row.targetCompany = at(32);
    row.avatarUrl = at(33);
    return row;
  }
  row.urn = at(0);
  row.fullName = at(1);
  row.firstName = at(2);
  row.lastName = at(3);
  row.linkedinUrl = at(4);
  row.headline = at(6);
  row.title = at(7);
  row.seniorityRaw = at(8);
  row.decisionMakerRaw = at(9);
  row.companyName = at(10);
  row.companyUrl = at(11);
  row.location = at(14);
  row.country = at(15);
  row.connectionDegree = at(16);
  row.followersCount = numAt(17);
  row.connectionsCount = numAt(18);
  row.relationshipType = at(19);
  row.reactionType = at(21);
  row.postUrl = at(23);
  row.postUrn = at(24);
  row.postSnippet = at(25);
  row.targetCompany = at(26);
  row.avatarUrl = at(27);
  return row;
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
    personId: str('personId'),
    fullName: str('fullName'),
    firstName: str('firstName'),
    lastName: str('lastName'),
    linkedinUrl: str('linkedinUrl'),
    headline: str('headline'),
    title: str('title'),
    seniorityRaw: str('seniorityRaw'),
    decisionMakerRaw: str('decisionMakerRaw'),
    companyName: str('companyName'),
    companyIsAuthoritative: false,
    companyUrl: str('companyUrl'),
    location: str('location'),
    country: str('country'),
    connectionDegree: str('connectionDegree'),
    followersCount: num('followersCount'),
    connectionsCount: num('connectionsCount'),
    relationshipType: str('relationshipType'),
    reactionType: str('reactionType'),
    commentedRaw: str('commentedRaw'),
    postUrl: str('postUrl'),
    postUrn: str('postUrn'),
    postSnippet: str('postSnippet'),
    targetCompany: str('targetCompany'),
    avatarUrl: str('avatarUrl'),
  };
}

function currentCompanyRecord(record: UnknownRecord): UnknownRecord | null {
  const decodedCurrentCompany = deepDecode(record.current_company ?? record.currentCompany);
  const currentCompanyValue = Array.isArray(decodedCurrentCompany)
    ? decodedCurrentCompany.find((value) => isRecord(value))
    : decodedCurrentCompany;
  return isRecord(currentCompanyValue) ? currentCompanyValue : null;
}

function currentCompanyPosition(currentCompany: UnknownRecord | null): string {
  if (!currentCompany) return '';
  return pickString(currentCompany, [
    'position',
    'positon',
    'current_position',
    'currentPosition',
    'job_title',
    'jobTitle',
    'title',
  ]);
}

function hasCurrentCompanyAndPosition(record: UnknownRecord): boolean {
  const currentCompany = currentCompanyRecord(record);
  const companyId = currentCompany ? pickString(currentCompany, ['company_id', 'companyId']) : '';
  return Boolean(currentCompany && companyId.trim() && currentCompanyPosition(currentCompany).trim());
}

function rowFromRecord(record: UnknownRecord, fromCompanyProfiles = false): RawPersonRow {
  const str = (field: keyof RawPersonRow): string => pickString(record, SYNONYM_MAP.get(field) ?? []);
  const num = (field: keyof RawPersonRow): number => pickNumber(record, SYNONYM_MAP.get(field) ?? []);
  const decodedCurrentCompany = deepDecode(record.current_company ?? record.currentCompany);
  const currentCompanyValue = Array.isArray(decodedCurrentCompany)
    ? decodedCurrentCompany.find((value) => isRecord(value))
    : decodedCurrentCompany;
  const currentCompany = isRecord(currentCompanyValue) ? currentCompanyValue : null;
  const currentCompanyName = currentCompany
    ? pickString(currentCompany, ['name', 'company', 'company_name', 'companyName', 'value', 'label', 'key', 'id'])
    : asString(currentCompanyValue);
  const currentCompanyUrl = currentCompany
    ? pickString(currentCompany, [
        'linkedin_url',
        'linkedinUrl',
        'profile_url',
        'profileUrl',
        'company_url',
        'companyUrl',
        'url',
      ])
    : '';
  const position = currentCompanyPosition(currentCompany);
  return {
    urn: str('urn'),
    personId: str('personId'),
    fullName: str('fullName') || pickString(record, ['name', 'full_name']),
    firstName: str('firstName'),
    lastName: str('lastName'),
    linkedinUrl: str('linkedinUrl'),
    headline: str('headline'),
    title: fromCompanyProfiles ? position || str('title') : str('title'),
    seniorityRaw: str('seniorityRaw'),
    decisionMakerRaw: str('decisionMakerRaw'),
    companyName: str('companyName') || currentCompanyName,
    companyIsAuthoritative: Boolean(currentCompanyName),
    companyUrl: str('companyUrl') || currentCompanyUrl,
    location: str('location'),
    country: str('country'),
    connectionDegree: str('connectionDegree'),
    followersCount: num('followersCount'),
    connectionsCount: num('connectionsCount'),
    relationshipType: str('relationshipType'),
    reactionType: str('reactionType'),
    commentedRaw: str('commentedRaw'),
    postUrl: str('postUrl'),
    postUrn: str('postUrn'),
    postSnippet: str('postSnippet'),
    targetCompany: str('targetCompany'),
    avatarUrl: str('avatarUrl') || imageUrlFromValue(record.profile_images ?? record.profileImages),
  };
}

const REACTION_WORDS =
  /^(like|praise|empathy|appreciation|interest|entertainment|love|celebrate|support|funny|insightful|curious|comment)$/i;

function normalizeDegree(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return '';
  if (/^(1|1st|first|distance_1|first_degree)$/.test(v)) return '1st';
  if (/^(2|2nd|second|distance_2|second_degree)$/.test(v)) return '2nd';
  if (/^(3|3rd|third|distance_3|3\+|third_degree)$/.test(v)) return '3rd';
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

function profileImageKeys(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const keys = new Set<string>();
  keys.add(trimmed.toLowerCase().replace(/\/+$/, ''));
  const slug = slugFromLinkedInUrl(trimmed);
  if (slug) keys.add(slug);
  return Array.from(keys);
}

function setProfileImage(acc: ParseAccumulator, profileKey: string, imageUrl: string): boolean {
  if (!isHttpUrl(imageUrl)) return false;
  let stored = false;
  for (const key of profileImageKeys(profileKey)) {
    acc.profileImagesByKey.set(key, imageUrl);
    stored = true;
  }
  return stored;
}

function profileImageForPerson(acc: ParseAccumulator, person: Person): string {
  for (const key of [...profileImageKeys(person.linkedinUrl), ...profileImageKeys(person.slug)]) {
    const imageUrl = acc.profileImagesByKey.get(key);
    if (imageUrl) return imageUrl;
  }
  return '';
}

function ingestProfileImages(raw: unknown, acc: ParseAccumulator): number {
  const decoded = deepDecode(raw);
  if (Array.isArray(decoded)) {
    let ingested = 0;
    for (const entry of decoded) {
      if (!isRecord(entry)) continue;
      const profileKey = pickString(entry, [
        'profile_url',
        'profileUrl',
        'linkedin_url',
        'linkedinUrl',
        'person_url',
        'personUrl',
        'slug',
        'username',
        'public_identifier',
        'publicIdentifier',
        'id',
      ]);
      const imageUrl = imageUrlFromValue(entry);
      if (profileKey && imageUrl && setProfileImage(acc, profileKey, imageUrl)) ingested += 1;
    }
    return ingested;
  }
  if (!isRecord(decoded)) return 0;

  const profileKey = pickString(decoded, [
    'profile_url',
    'profileUrl',
    'linkedin_url',
    'linkedinUrl',
    'person_url',
    'personUrl',
    'slug',
    'username',
    'public_identifier',
    'publicIdentifier',
    'id',
  ]);
  const directImageUrl = imageUrlFromValue(decoded);
  if (profileKey && directImageUrl && setProfileImage(acc, profileKey, directImageUrl)) return 1;

  let ingested = 0;
  for (const [profileKey, value] of Object.entries(decoded)) {
    if (/^(profiles?|images?|data|items)$/i.test(profileKey)) {
      ingested += ingestProfileImages(value, acc);
      continue;
    }
    const imageUrl = imageUrlFromValue(value);
    if (imageUrl && setProfileImage(acc, profileKey, imageUrl)) ingested += 1;
  }
  return ingested;
}

function personSlug(row: RawPersonRow): string {
  const fromUrl = slugFromLinkedInUrl(row.linkedinUrl);
  if (fromUrl) return fromUrl;
  const personId = row.personId.trim().toLowerCase();
  if (personId) return personId.replace(/^urn:li:(?:person|member):/, '');
  const urn = row.urn.trim().toLowerCase();
  if (urn && !urn.includes('|')) return urn.replace(/^urn:li:(?:person|member):/, '');
  return normalizeName(row.fullName || `${row.firstName} ${row.lastName}`);
}

function lookupKeysForRow(row: RawPersonRow): string[] {
  const keys: string[] = [];
  const push = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
  };
  push(slugFromLinkedInUrl(row.linkedinUrl));
  push(row.personId.replace(/^urn:li:(?:person|member):/i, ''));
  const urn = row.urn.trim();
  if (urn && !urn.includes('|')) push(urn.replace(/^urn:li:(?:person|member):/i, ''));
  push(personSlug(row));
  push(normalizeName(row.fullName || `${row.firstName} ${row.lastName}`));
  return keys.filter(Boolean);
}

function companyFromHeadline(headline: string): string {
  const text = headline.trim();
  if (!text) return '';
  const atHandle = text.match(/@([A-Za-z0-9²][A-Za-z0-9²._&']{1,40})(?!\.[a-z]{2,})/);
  if (atHandle) return cleanCompanyName(atHandle[1]);
  const atSpaced = text.match(/@\s+([A-Z][A-Za-z0-9²&'. -]{1,40}?)(?=\s*[|•·,]|$)/);
  if (atSpaced) return cleanCompanyName(atSpaced[1]);
  const atWord = text.match(/(?:^|[\s|•·,])at\s+([A-Z0-9²][^|•·,\n]{0,40}?)(?=\s*[|•·,]|$)/);
  if (atWord) return cleanCompanyName(atWord[1]);
  const inc = text.match(/,\s*([A-Z][^|•·\n]{2,40}?\b(?:Inc\.?|Ltd\.?|LLC|GmbH|Limited))/);
  if (inc) return cleanCompanyName(inc[1]);
  const founderCo = text.match(
    /^(?:co-?founder(?:\s*&\s*\w+)?|founder|cmo|ceo|cto|cfo|coo)\b[^,]*,\s*([A-Z][^|•·\n]{1,40})$/i
  );
  if (founderCo) return cleanCompanyName(founderCo[1]);
  return '';
}

function companyFromHeadlineLead(headline: string, title: string): string {
  const first = headline.split(/\s*[|•·]{1,}\s*/)[0]?.trim() || '';
  if (!first || /@|(?:^|[\s,])at\s/i.test(first)) return '';
  const cleaned = cleanCompanyName(first);
  if (!cleaned) return '';
  if (title.trim().toLowerCase() !== cleaned.toLowerCase()) return '';
  return cleaned;
}

function resolveCompanyName(row: RawPersonRow): string {
  const authoritative = cleanCompanyName(row.companyName);
  if (row.companyIsAuthoritative && authoritative) return authoritative;
  const candidates = [
    authoritative,
    companyFromHeadline(row.headline),
    companyFromHeadlineLead(row.headline, row.title),
  ];
  for (const candidate of candidates) {
    if (candidate && isCompanyDisplayName(candidate)) return candidate;
  }
  return '';
}

function computeIsInternal(row: RawPersonRow, companyName: string): boolean {
  const rel = row.relationshipType.trim().toLowerCase();
  if (/(internal|employee|staff)/.test(rel)) return true;
  const company = normalizeName(companyName);
  const target = normalizeName(row.targetCompany);
  if (company && target && company.length >= 3 && target.length >= 3) {
    if (company === target || company.includes(target) || target.includes(company)) return true;
  }
  return false;
}

function isPostRef(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^(yes|no|true|false|employee|external|n\/a|none|null)$/i.test(v)) return false;
  return isHttpUrl(v) || /linkedin\.com\//i.test(v) || /urn:li:/i.test(v) || /\d{8,}/.test(v);
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
  row: RawPersonRow,
  fromCompanyProfiles = false,
  includeInPeopleTab = false
): boolean {
  const fullName = (row.fullName || `${row.firstName} ${row.lastName}`).trim();
  if (!row.urn.trim() && !row.linkedinUrl.trim() && !row.personId.trim() && !fullName) return false;
  if (/^(person full name|full name|name|unique key)$/i.test(fullName)) return false;
  const keys = lookupKeysForRow(row);
  const slug = keys[0] || personSlug(row);
  if (!slug) return false;
  const peopleBySlug = fromCompanyProfiles ? acc.companyProfilePeopleBySlug : acc.peopleBySlug;
  let person: Person | undefined;
  for (const key of keys) {
    person = peopleBySlug.get(key);
    if (person) break;
  }
  const companyName = resolveCompanyName(row);
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
      companyName,
      companyUrl: isHttpUrl(row.companyUrl) ? row.companyUrl.trim() : '',
      location: row.location.trim(),
      country: row.country.trim(),
      connectionDegree: normalizeDegree(row.connectionDegree),
      followersCount: row.followersCount,
      connectionsCount: row.connectionsCount,
      relationshipType: row.relationshipType.trim(),
      isInternal: computeIsInternal(row, companyName),
      avatarUrl: isHttpUrl(row.avatarUrl) ? row.avatarUrl.trim() : '',
      targetCompany: row.targetCompany.trim(),
      interactions: [],
      engagementCount: 0,
    };
  } else {
    if (!person.fullName && fullName) person.fullName = fullName;
    if (!person.headline && row.headline.trim()) person.headline = row.headline.trim();
    if (!person.title && row.title.trim()) person.title = row.title.trim();
    if (
      companyName &&
      (row.companyIsAuthoritative || !person.companyName || !isCompanyDisplayName(person.companyName))
    ) {
      person.companyName = companyName;
    }
    if ((row.companyIsAuthoritative || !person.companyUrl) && isHttpUrl(row.companyUrl)) {
      person.companyUrl = row.companyUrl.trim();
    }
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
    if (!person.isInternal && computeIsInternal(row, companyName || person.companyName)) person.isInternal = true;
  }
  for (const key of keys) peopleBySlug.set(key, person);
  if (fromCompanyProfiles) {
    if (includeInPeopleTab) {
      for (const key of keys) acc.peopleCompanyProfilesBySlug.set(key, person);
    }
    return true;
  }

  const postUrl = isHttpUrl(row.postUrl)
    ? row.postUrl.trim()
    : /^(www\.)?linkedin\.com\//i.test(row.postUrl.trim())
      ? `https://${row.postUrl.trim()}`
      : '';
  const postKeySource = [row.postUrn, postUrl || row.postUrl].find(isPostRef) || '';
  if (postKeySource) {
    const postKey = extractActivityId(postKeySource);
    if (!postKey || /^(yes|no|true|false)$/i.test(postKey)) return true;
    const reactionType =
      normalizeReaction(row.reactionType) ||
      (parseBoolean(row.commentedRaw) ? 'COMMENT' : 'LIKE');
    const rawSnippet = row.postSnippet;
    const snippet =
      rawSnippet.length > MAX_SNIPPET_LENGTH ? `${rawSnippet.slice(0, MAX_SNIPPET_LENGTH)}…` : rawSnippet;
    const duplicate = person.interactions.some(
      (existing) => existing.postKey === postKey && existing.reactionType === reactionType
    );
    if (!duplicate) {
      const interaction: PersonInteraction = {
        postKey,
        postUrl: postUrl || (isHttpUrl(row.postUrl) ? row.postUrl.trim() : ''),
        postSnippet: snippet,
        reactionType,
      };
      person.interactions.push(interaction);
      person.engagementCount += 1;
      acc.engagements.push({
        postKey,
        personSlug: person.slug,
        engagementType: /comment/i.test(reactionType) ? 'comment' : 'reaction',
        reactionType,
      });
      const engagerKeys = new Set<string>([
        postKey,
        ...activityIdsFrom(row.postUrn),
        ...activityIdsFrom(postUrl || row.postUrl),
      ]);
      for (const key of engagerKeys) {
        if (!key) continue;
        let engagers = engagerSets.get(key);
        if (!engagers) {
          engagers = new Set<string>();
          engagerSets.set(key, engagers);
        }
        engagers.add(person.slug);
      }
    }
  }
  return true;
}

function headerMapFromValue(raw: unknown): Partial<Record<keyof RawPersonRow, number>> | null {
  const decoded = deepDecode(raw);
  return Array.isArray(decoded) ? buildHeaderMap(decoded) : null;
}

function ingestPeopleValue(
  raw: unknown,
  acc: ParseAccumulator,
  engagerSets: Map<string, Set<string>>,
  fromCompanyProfiles = false
): number {
  const decoded = deepDecode(raw);
  let items: unknown[] = [];
  let headerMap: Partial<Record<keyof RawPersonRow, number>> | null = null;
  if (Array.isArray(decoded)) {
    items = decoded;
  } else if (isRecord(decoded)) {
    headerMap =
      headerMapFromValue(decoded.header) ??
      headerMapFromValue(decoded.headers) ??
      headerMapFromValue(decoded.columns);
    const inner = deepDecode(
      fromCompanyProfiles
        ? decoded.people ?? decoded.values ?? decoded.rows ?? decoded.items ?? decoded.data
        : decoded.values ?? decoded.rows ?? decoded.items ?? decoded.data ?? decoded.engagementRecords
    );
    if (Array.isArray(inner)) items = inner;
  }
  if (items.length === 0) return 0;
  let ingested = 0;
  for (const entry of items) {
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
      if (ingestPersonRow(acc, engagerSets, row, fromCompanyProfiles)) ingested += 1;
      continue;
    }
    if (isRecord(rowValue)) {
      const row = rowFromRecord(rowValue, fromCompanyProfiles);
      const includeInPeopleTab = fromCompanyProfiles && hasCurrentCompanyAndPosition(rowValue);
      if (ingestPersonRow(acc, engagerSets, row, fromCompanyProfiles, includeInPeopleTab)) ingested += 1;
    }
  }
  return ingested;
}

function ingestCompanySummaries(raw: unknown, acc: ParseAccumulator): number {
  const decoded = deepDecode(raw);
  if (!Array.isArray(decoded)) return 0;
  let ingested = 0;
  for (const entry of decoded) {
    const record = deepDecode(entry);
    if (!isRecord(record)) continue;
    const name = pickString(record, ['name', 'company_name', 'companyName']).trim();
    const companyId = pickString(record, ['company_id', 'companyId', 'id']).trim();
    const companyUrl = pickString(record, ['linkedin_url', 'linkedinUrl', 'profile_url', 'profileUrl']).trim();
    const peopleCount = pickNumber(record, ['people_count', 'peopleCount', 'employee_count']);
    if (!name || (!companyId && !companyUrl && peopleCount === 0)) continue;
    const key = companyKey(name);
    if (!key) continue;
    const existing = acc.companiesByKey.get(key);
    if (existing) {
      existing.peopleCount = Math.max(existing.peopleCount, peopleCount);
      if (!existing.companyId && companyId) existing.companyId = companyId;
      if (!existing.companyUrl && companyUrl) existing.companyUrl = companyUrl;
    } else {
      acc.companiesByKey.set(key, { name, companyId, companyUrl, peopleCount });
    }
    ingested += 1;
  }
  return ingested;
}

const MAX_WALK_DEPTH = 10;

const PEOPLE_KEY_PATTERN = /(profiledata|usersprofile|people|person|engager|engagement)/;
const POST_KEY_PATTERN = /(recentlistposts|^posts$|postslist|listposts)/;

function isCompanyProfilePersonRecord(record: UnknownRecord): boolean {
  const currentCompanyValue = deepDecode(record.current_company ?? record.currentCompany);
  const name = pickString(record, ['name', 'full_name', 'fullName', 'person_name', 'personName']);
  return Boolean(
    name &&
      (currentCompanyRecord(record) ||
        (typeof currentCompanyValue === 'string' && currentCompanyValue.trim()))
  );
}

function walk(
  node: unknown,
  acc: ParseAccumulator,
  engagerSets: Map<string, Set<string>>,
  depth: number,
  fromCompanyProfiles = false
): void {
  if (depth > MAX_WALK_DEPTH) return;
  const decoded = deepDecode(node);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      if (item === null || item === undefined) continue;
      walk(item, acc, engagerSets, depth + 1, fromCompanyProfiles);
    }
    return;
  }
  if (!isRecord(decoded)) return;
  if (fromCompanyProfiles && isCompanyProfilePersonRecord(decoded)) {
    ingestPeopleValue([decoded], acc, engagerSets, true);
    return;
  }
  for (const [key, rawInner] of Object.entries(decoded)) {
    if (rawInner === null || rawInner === undefined) continue;
    const normalized = normalizeKey(key);
    // Decode each branch a single time so large double-encoded strings are not
    // re-parsed by every candidate section handler below.
    const inner = deepDecode(rawInner);
    const inCompanyProfiles = fromCompanyProfiles || normalized === 'peoplecompanyprofiles';
    if (normalized === 'profileimages') {
      const ingested = ingestProfileImages(inner, acc);
      if (ingested > 0) continue;
    }
    if (!acc.company && (normalized === 'companyprofile' || normalized === 'company' || normalized === 'companydetails')) {
      const company = parseCompanyProfile(inner);
      if (company) {
        acc.company = company;
        continue;
      }
    }
    if (normalized === 'companies' && inCompanyProfiles) {
      const ingested = ingestCompanySummaries(inner, acc);
      if (ingested > 0) continue;
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
      const ingested = ingestPeopleValue(inner, acc, engagerSets, inCompanyProfiles);
      // people_company_profiles can contain both `people` and `companies`;
      // keep walking this wrapper so company summaries are still ingested.
      if (ingested > 0 && normalized !== 'peoplecompanyprofiles') continue;
    }
    if (typeof inner === 'string') continue;
    walk(inner, acc, engagerSets, depth + 1, inCompanyProfiles);
  }
}

export function parseWorkflowResponse(raw: unknown): DashboardData {
  const acc: ParseAccumulator = {
    company: null,
    companiesByKey: new Map<string, CompanySummary>(),
    companyProfilePeopleBySlug: new Map<string, Person>(),
    peopleCompanyProfilesBySlug: new Map<string, Person>(),
    profileImagesByKey: new Map<string, string>(),
    postsById: new Map<string, PostItem>(),
    peopleBySlug: new Map<string, Person>(),
    engagements: [],
  };
  const engagerSets = new Map<string, Set<string>>();
  walk(raw, acc, engagerSets, 0);
  const posts = Array.from(acc.postsById.values());
  for (const post of posts) {
    const postIds = new Set<string>();
    for (const value of [post.id, post.activityKey, post.socialId, post.shareUrl]) {
      const trimmed = (value || '').trim();
      if (!trimmed) continue;
      postIds.add(trimmed);
      for (const id of activityIdsFrom(trimmed)) postIds.add(id);
    }
    const combined = new Set<string>();
    for (const [key, slugs] of engagerSets) {
      const extracted = extractActivityId(key);
      if (!postIds.has(key) && !postIds.has(extracted)) continue;
      for (const slug of slugs) combined.add(slug);
    }
    post.engagerSlugs = Array.from(combined);
    if (!post.shareUrl) {
      const activityId = extractActivityId(post.id) || post.activityKey;
      if (/^\d{8,}$/.test(activityId)) {
        post.shareUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}/`;
      }
    }
  }
  const uniquePeople: Person[] = [];
  const seenPeople = new Set<Person>();
  for (const person of acc.peopleBySlug.values()) {
    if (seenPeople.has(person)) continue;
    seenPeople.add(person);
    uniquePeople.push(person);
  }
  const peopleCompanyProfiles = Array.from(new Set(acc.peopleCompanyProfilesBySlug.values())).map((person) => {
    const matchedEngager = uniquePeople.find(
      (candidate) =>
        candidate.slug === person.slug ||
        (candidate.linkedinUrl && person.linkedinUrl && candidate.linkedinUrl === person.linkedinUrl) ||
        (candidate.fullName && person.fullName && normalizeName(candidate.fullName) === normalizeName(person.fullName))
    );
    if (!matchedEngager) return person;
    return {
      ...person,
      interactions: matchedEngager.interactions,
      engagementCount: matchedEngager.engagementCount,
    };
  });
  const companies: CompanyAggregate[] = Array.from(acc.companiesByKey.values())
    .map((summary) => {
      const companyPeople = Array.from(new Set(acc.companyProfilePeopleBySlug.values()))
        .filter(
          (person) => {
            const personNameKey = companyKey(person.companyName);
            const personUrlKey = companyKey(person.companyUrl);
            const summaryNameKey = companyKey(summary.name);
            const summaryIdKey = companyKey(summary.companyId);
            const summaryUrlKey = companyKey(summary.companyUrl);
            return (
              (personNameKey && personNameKey === summaryNameKey) ||
              (personNameKey && summaryIdKey && personNameKey === summaryIdKey) ||
              (personUrlKey && summaryUrlKey && personUrlKey === summaryUrlKey)
            );
          }
        )
        .map((person) => {
          const profileImage = person.avatarUrl || profileImageForPerson(acc, person);
          const companyPerson = profileImage ? { ...person, avatarUrl: profileImage } : person;
          const matchedEngager = uniquePeople.find(
            (candidate) =>
              candidate.slug === person.slug ||
              (candidate.linkedinUrl && person.linkedinUrl && candidate.linkedinUrl === person.linkedinUrl) ||
              (candidate.fullName && person.fullName && normalizeName(candidate.fullName) === normalizeName(person.fullName))
          );
          if (!matchedEngager) return companyPerson;
          return {
            ...companyPerson,
            interactions: matchedEngager.interactions,
            engagementCount: matchedEngager.engagementCount,
            isDecisionMaker: person.isDecisionMaker || matchedEngager.isDecisionMaker,
            seniority: person.seniority === 'Unknown' ? matchedEngager.seniority : person.seniority,
          };
        });
      const seniorityCounts = { 'C-Level': 0, Director: 0, Manager: 0, IC: 0, Unknown: 0 };
      for (const person of companyPeople) seniorityCounts[person.seniority] += 1;
      return {
        name: summary.name,
        companyId: summary.companyId,
        companyUrl: summary.companyUrl,
        peopleCount: companyPeople.length,
        decisionMakerCount: companyPeople.filter((person) => person.isDecisionMaker).length,
        totalEngagements: companyPeople.reduce((sum, person) => sum + person.engagementCount, 0),
        seniorityCounts,
        people: companyPeople,
      };
    })
    .sort(
      (a, b) =>
        b.peopleCount - a.peopleCount ||
        b.totalEngagements - a.totalEngagements ||
        a.name.localeCompare(b.name)
    );
  return {
    company: acc.company,
    posts,
    people: uniquePeople,
    peopleCompanyProfiles,
    engagements: acc.engagements,
    companies,
  };
}
