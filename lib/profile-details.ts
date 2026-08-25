import type { ProfileDetails } from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
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

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
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

function firstString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    if (!(key in record)) continue;
    const raw = record[key];
    if (Array.isArray(raw) && raw.length > 0) {
      const value = asString(raw[0]);
      if (value) return value;
    }
    const value = asString(raw);
    if (value) return value;
  }
  return '';
}

function firstNumber(record: UnknownRecord, keys: string[]): number {
  for (const key of keys) {
    if (!(key in record)) continue;
    const value = asNumber(record[key]);
    if (value !== 0) return value;
  }
  return 0;
}

/** Nested LinkedIn profile objects that carry company vs person fields. */
const PROFILE_NEST_KEYS = [
  'profile_details',
  'profileDetails',
  'company_details',
  'companyDetails',
  'company_profile',
  'companyProfile',
  'person_profile',
  'personProfile',
  'personal_profile',
  'personalProfile',
  'raw',
  'profile',
] as const;

/**
 * Walks company_profile.raw.profile / person_profile.raw.profile style nesting
 * without scanning engagement records or post bodies.
 */
export function flattenProfileLayers(record: UnknownRecord, depth = 0): UnknownRecord[] {
  if (depth > 4) return [record];
  const layers: UnknownRecord[] = [record];
  for (const key of PROFILE_NEST_KEYS) {
    if (!(key in record)) continue;
    const nested = deepDecode(record[key]);
    if (isRecord(nested)) {
      layers.push(...flattenProfileLayers(nested, depth + 1));
    }
  }
  return layers;
}

function pickFromLayers(layers: UnknownRecord[], keys: string[]): string {
  for (const layer of layers) {
    const value = firstString(layer, keys);
    if (value) return value;
  }
  return '';
}

function pickNumberFromLayers(layers: UnknownRecord[], keys: string[]): number {
  for (const layer of layers) {
    const value = firstNumber(layer, keys);
    if (value !== 0) return value;
  }
  return 0;
}

function isHistoryEnvelopeLayer(layer: UnknownRecord): boolean {
  return (
    ('output' in layer && ('created_at' in layer || 'createdAt' in layer || 'created_at_ist' in layer)) ||
    ('output' in layer && 'profile_details' in layer)
  );
}

/** True for company_profile / UserProfile layers — not history row wrappers or posts. */
function isLinkedInAccountLayer(layer: UnknownRecord): boolean {
  if (isHistoryEnvelopeLayer(layer)) return false;
  const objectType = asString(layer.object);
  if (/companyprofile|userprofile|personprofile/i.test(objectType)) return true;
  const url = asString(layer.profile_url) || asString(layer.profileUrl);
  if (/linkedin\.com\/(in|company)\//i.test(url)) return true;
  if (isRecord(layer.raw) || isRecord(layer.profile)) return true;
  return false;
}

function accountIdFromUrn(value: string): string {
  const match = value.match(/(?:urn:li:)?(?:fsd_company|company|organization):(\d+)/i);
  return match?.[1] ?? '';
}

/**
 * LinkedIn account_id lives on profile_details.account_id, or as `id` on
 * company_profile / raw / profile (e.g. "60223"). Never use the history row id.
 */
function pickAccountIdFromLayers(layers: UnknownRecord[]): string {
  const named = pickFromLayers(layers, [
    'account_id',
    'accountId',
    'provider_id',
    'providerId',
    'company_id',
    'companyId',
  ]);
  if (named) return named;
  for (const layer of layers) {
    if (!isLinkedInAccountLayer(layer)) continue;
    const id = asString(layer.id);
    if (id) return id;
    const fromUrn = accountIdFromUrn(asString(layer.entity_urn ?? layer.entityUrn));
    if (fromUrn) return fromUrn;
  }
  return '';
}

function flagIsCompany(flag: unknown): boolean | null {
  if (flag === true || flag === 1) return true;
  if (flag === false || flag === 0) return false;
  if (typeof flag === 'string') {
    const normalized = flag.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return null;
}

/**
 * Personal history rows reuse `company_profile` as a UserProfile wrapper
 * (`is_company: "false"`, `object: "UserProfile"`, `/in/` URL). Presence of
 * that key must not classify the row as a company page.
 */
function detectIsCompany(layers: UnknownRecord[], parentType = ''): boolean {
  const type = parentType || pickFromLayers(layers, ['profile_type', 'profileType', 'entity_type', 'entityType']);
  if (/person|personal|people|individual|member/i.test(type)) return false;
  if (/company|organization|organisation|business/i.test(type)) return true;
  for (const layer of layers) {
    const objectType = asString(layer.object);
    if (/userprofile|personprofile/i.test(objectType)) return false;
    if (/companyprofile/i.test(objectType)) return true;
  }
  for (const layer of layers) {
    const flagged = flagIsCompany(layer.is_company ?? layer.isCompany);
    if (flagged !== null) return flagged;
  }
  const url = pickFromLayers(layers, ['profile_url', 'profileUrl', 'company_profile_url', 'companyProfileUrl']);
  if (/linkedin\.com\/in\//i.test(url)) return false;
  if (/linkedin\.com\/company\//i.test(url)) return true;
  return false;
}

export function isCompanyProfileNode(raw: unknown, parentType = ''): boolean {
  const decoded = deepDecode(raw);
  if (!isRecord(decoded)) return false;
  return detectIsCompany(flattenProfileLayers(decoded), parentType);
}

export function emptyProfileDetails(): ProfileDetails {
  return {
    name: '',
    profileUrl: '',
    accountId: '',
    slug: '',
    logoUrl: '',
    tagline: '',
    description: '',
    industry: '',
    location: '',
    followersCount: 0,
    isCompany: false,
  };
}

export function completeProfileDetails(partial: Partial<ProfileDetails> | null | undefined): ProfileDetails {
  return { ...emptyProfileDetails(), ...partial };
}

/**
 * Reads a `profile_details`-shaped record into a ProfileDetails object.
 * Company pages use tagline / logo / company profile_url from company_profile.raw.profile.
 * Personal pages use headline / profile_picture_url / /in/ profile_url.
 * History row `id` (e.g. "43") is ignored; company_profile.id / account_id are used.
 */
function readDetails(record: UnknownRecord, parentType = ''): ProfileDetails | null {
  const layers = flattenProfileLayers(record);
  const isCompany = detectIsCompany(layers, parentType);
  let name = pickFromLayers(
    layers,
    isCompany ? ['name', 'company', 'company_name', 'companyName'] : ['name', 'full_name', 'fullName']
  );
  if (!isCompany && !name) {
    const first = pickFromLayers(layers, ['first_name', 'firstName']);
    const last = pickFromLayers(layers, ['last_name', 'lastName']);
    name = [first, last].filter(Boolean).join(' ');
  }
  const rawProfileUrl = pickFromLayers(
    layers,
    isCompany
      ? ['profile_url', 'profileUrl', 'company_profile_url', 'companyProfileUrl']
      : ['profile_url', 'profileUrl', 'linkedin_url', 'linkedinUrl']
  );
  const accountId = pickAccountIdFromLayers(layers);
  const slug = pickFromLayers(layers, [
    'slug',
    'company_slug',
    'companySlug',
    'public_identifier',
    'publicIdentifier',
    'universal_name',
    'universalName',
  ]);
  const rawLogo = isCompany
    ? pickFromLayers(layers, ['logo', 'logo_large', 'logo_url', 'logoUrl', 'image', 'image_url'])
    : pickFromLayers(layers, [
        'profile_picture_url_large',
        'profile_picture_url',
        'profilePictureUrl',
        'picture',
        'pictureUrl',
        'avatar',
        'avatar_url',
        'avatarUrl',
      ]);
  // Company copy is tagline (short); personal copy is headline. Never use the
  // about/summary blob as the header line for a person.
  const tagline = isCompany
    ? pickFromLayers(layers, ['tagline']) || pickFromLayers(layers, ['description', 'about', 'summary'])
    : pickFromLayers(layers, ['headline', 'sub_title', 'subtitle']);
  const description = isCompany
    ? pickFromLayers(layers, ['description', 'about', 'summary'])
    : pickFromLayers(layers, ['summary', 'about']);
  const industry = pickFromLayers(layers, ['industry', 'industries']);
  const location = pickFromLayers(layers, ['location', 'headquarters', 'hq', 'geo_region', 'city']);
  const followersCount = pickNumberFromLayers(layers, [
    'followers_count',
    'follower_count',
    'followers',
    'followerCount',
  ]);
  const profileUrl = isHttpUrl(rawProfileUrl) ? rawProfileUrl : '';
  const logoUrl = isHttpUrl(rawLogo) ? rawLogo : '';
  if (!name && !profileUrl && !accountId) return null;
  return {
    ...emptyProfileDetails(),
    name,
    profileUrl,
    accountId,
    slug,
    logoUrl,
    tagline,
    description,
    industry,
    location,
    followersCount,
    isCompany,
  };
}

/**
 * Deep-searches an Analyze/History workflow response (including double-JSON-encoded
 * strings and nested `output.rows[n]` structures) for a `profile_details` object and
 * extracts company vs personal fields from that object only (not engagement rows).
 */
export function extractProfileDetailsFromResponse(raw: unknown, depth = 10): ProfileDetails | null {
  if (depth <= 0) return null;
  const decoded = deepDecode(raw);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const found = extractProfileDetailsFromResponse(item, depth - 1);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(decoded)) return null;
  const parentType = firstString(decoded, ['profile_type', 'profileType']);
  const isEnvelope =
    Boolean(parentType) ||
    [
      'profile_details',
      'profileDetails',
      'company_details',
      'companyDetails',
      'company_profile',
      'companyProfile',
      'person_profile',
      'personProfile',
      'personal_profile',
      'personalProfile',
    ].some((key) => key in decoded);
  if (isEnvelope || isLinkedInAccountLayer(decoded)) {
    const selfDetails = readDetails(decoded, parentType);
    if (selfDetails) return selfDetails;
  }
  for (const key of [
    'profile_details',
    'profileDetails',
    'company_details',
    'companyDetails',
    'company_profile',
    'companyProfile',
    'person_profile',
    'personProfile',
    'personal_profile',
    'personalProfile',
  ]) {
    if (key in decoded) {
      const nested = deepDecode(decoded[key]);
      if (isRecord(nested)) {
        const details = readDetails(nested, parentType);
        if (details) return details;
      }
    }
  }
  for (const key of ['output', 'rows', 'data', 'result', 'response']) {
    if (!(key in decoded)) continue;
    const found = extractProfileDetailsFromResponse(decoded[key], depth - 1);
    if (found) return found;
  }
  for (const value of Object.values(decoded)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    }
    const found = extractProfileDetailsFromResponse(value, depth - 1);
    if (found) return found;
  }
  return null;
}

const PROFILE_URL_KEYS = [
  'profile_url',
  'profileUrl',
  'company_profile_url',
  'companyProfileUrl',
  'linkedin_url',
  'linkedinUrl',
];

function deepFindKeyValue(raw: unknown, keys: string[], requireUrl: boolean, depth: number): string {
  if (depth <= 0) return '';
  const decoded = deepDecode(raw);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const found = deepFindKeyValue(item, keys, requireUrl, depth - 1);
      if (found) return found;
    }
    return '';
  }
  if (!isRecord(decoded)) return '';
  const direct = firstString(decoded, keys);
  if (direct && (!requireUrl || isHttpUrl(direct))) return direct;
  for (const key of PROFILE_NEST_KEYS) {
    if (!(key in decoded)) continue;
    const found = deepFindKeyValue(decoded[key], keys, requireUrl, depth - 1);
    if (found) return found;
  }
  for (const key of ['output', 'rows', 'data', 'result', 'response']) {
    if (!(key in decoded)) continue;
    const found = deepFindKeyValue(decoded[key], keys, requireUrl, depth - 1);
    if (found) return found;
  }
  for (const value of Object.values(decoded)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    }
    const found = deepFindKeyValue(value, keys, requireUrl, depth - 1);
    if (found) return found;
  }
  return '';
}

function deepFindAccountId(raw: unknown, depth: number): string {
  if (depth <= 0) return '';
  const decoded = deepDecode(raw);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const found = deepFindAccountId(item, depth - 1);
      if (found) return found;
    }
    return '';
  }
  if (!isRecord(decoded)) return '';
  const fromLayer = pickAccountIdFromLayers([decoded]);
  if (fromLayer) return fromLayer;
  for (const key of PROFILE_NEST_KEYS) {
    if (!(key in decoded)) continue;
    const found = deepFindAccountId(decoded[key], depth - 1);
    if (found) return found;
  }
  for (const key of ['output', 'rows', 'data', 'result', 'response']) {
    if (!(key in decoded)) continue;
    const found = deepFindAccountId(decoded[key], depth - 1);
    if (found) return found;
  }
  for (const value of Object.values(decoded)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    }
    const found = deepFindAccountId(value, depth - 1);
    if (found) return found;
  }
  return '';
}

/**
 * Deep-searches a stored history/analyze payload for a usable LinkedIn profile URL
 * (`profile_url` / `company_profile_url` at any nesting level, e.g.
 * `company_details.profile_url` or `output.company_profile.profile_url`).
 */
export function extractProfileUrlFromResponse(raw: unknown, depth = 10): string {
  const details = extractProfileDetailsFromResponse(raw, depth);
  if (details?.profileUrl) return details.profileUrl;
  return deepFindKeyValue(raw, PROFILE_URL_KEYS, true, depth);
}

/**
 * Deep-searches a stored history/analyze payload for the LinkedIn `account_id`
 * so the Refresh payload never sends an empty account_id.
 */
export function extractAccountIdFromResponse(raw: unknown, depth = 10): string {
  const details = extractProfileDetailsFromResponse(raw, depth);
  if (details?.accountId) return details.accountId;
  return deepFindAccountId(raw, depth);
}

/**
 * Builds Analyze/Refresh identifiers from the currently loaded profile and any
 * stored response payloads (history row, analyze output, company_profile).
 */
export function resolveRefreshIdentifiers(input: {
  details?: ProfileDetails | null;
  profileUrl?: string;
  accountId?: string;
  slug?: string;
  payloads?: unknown[];
}): { profileUrl: string; accountId: string; slug: string } {
  let profileUrl = '';
  let accountId = '';
  let slug = '';
  const takeUrl = (value: string | undefined) => {
    if (profileUrl || !value) return;
    const trimmed = value.trim();
    if (isHttpUrl(trimmed)) profileUrl = trimmed;
  };
  const takeId = (value: string | undefined) => {
    if (!accountId && value?.trim()) accountId = value.trim();
  };
  const takeSlug = (value: string | undefined) => {
    if (!slug && value?.trim()) slug = value.trim();
  };

  takeUrl(input.details?.profileUrl);
  takeId(input.details?.accountId);
  takeSlug(input.details?.slug);
  takeUrl(input.profileUrl);
  takeId(input.accountId);
  takeSlug(input.slug);

  for (const payload of input.payloads ?? []) {
    if (payload == null) continue;
    const extracted = extractProfileDetailsFromResponse(payload);
    takeUrl(extracted?.profileUrl);
    takeId(extracted?.accountId);
    takeSlug(extracted?.slug);
    takeUrl(extractProfileUrlFromResponse(payload));
    takeId(extractAccountIdFromResponse(payload));
    if (profileUrl && accountId && slug) break;
  }
  return { profileUrl, accountId, slug };
}
