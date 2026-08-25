import type { SearchResultItem } from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[,+\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
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

function pickString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  const entries = Object.entries(record);
  for (const key of keys) {
    const target = normalizeKey(key);
    for (const [recordKey, recordValue] of entries) {
      if (normalizeKey(recordKey) !== target) continue;
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

function pickBoolean(record: UnknownRecord, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return asBoolean(value);
  }
  const entries = Object.entries(record);
  for (const key of keys) {
    const target = normalizeKey(key);
    for (const [recordKey, recordValue] of entries) {
      if (normalizeKey(recordKey) !== target) continue;
      if (recordValue !== undefined && recordValue !== null) return asBoolean(recordValue);
    }
  }
  return false;
}

function looksLikeResult(record: UnknownRecord): boolean {
  return Boolean(
    pickString(record, ['name', 'full_name', 'fullname']) ||
      pickString(record, ['headline']) ||
      pickString(record, ['profile_url', 'profileurl', 'url', 'linkedin_url'])
  );
}

function findResultsArray(value: unknown, depth = 6): unknown[] | null {
  if (depth <= 0) return null;
  const decoded = deepDecode(value);
  if (Array.isArray(decoded)) {
    if (decoded.length === 1) {
      const first = deepDecode(decoded[0]);
      if (isRecord(first) && !looksLikeResult(first)) {
        const nested = findResultsArray(first, depth - 1);
        if (nested && nested.length > 0) return nested;
      }
    }
    return decoded;
  }
  if (!isRecord(decoded)) return null;
  const preferred = ['results', 'items', 'people', 'companies', 'output', 'rows', 'data', 'response'];
  for (const key of preferred) {
    if (key in decoded) {
      const found = findResultsArray(decoded[key], depth - 1);
      if (found && found.length > 0) return found;
    }
  }
  for (const entry of Object.values(decoded)) {
    const found = findResultsArray(entry, depth - 1);
    if (found && found.length > 0) return found;
  }
  return null;
}

/**
 * Parses the entity search workflow response into a normalized card list.
 */
export function parseSearchResults(raw: unknown, isCompany: boolean): SearchResultItem[] {
  const arr = findResultsArray(raw);
  if (!arr) return [];
  const items: SearchResultItem[] = [];
  const seen = new Set<string>();
  for (const entry of arr) {
    const record = deepDecode(entry);
    if (!isRecord(record)) continue;
    const name = pickString(record, ['name', 'full_name', 'fullname', 'title']);
    const rawProfileUrl = pickString(record, [
      'profile_url',
      'profileurl',
      'url',
      'linkedin_url',
      'linkedinurl',
      'public_url',
      'navigation_url',
    ]);
    const profileUrl = isHttpUrl(rawProfileUrl) ? rawProfileUrl : '';
    const id = pickString(record, ['account_id', 'accountid', 'id', 'urn', 'entity_urn', 'member_id']);
    const slug = pickString(record, [
      'company_slug',
      'slug',
      'public_identifier',
      'publicidentifier',
      'universal_name',
      'universalname',
    ]);
    let avatarUrl = isCompany
      ? pickString(record, ['logo', 'logo_url', 'logourl', 'image_url', 'image'])
      : pickString(record, ['profile_picture_url', 'profilepictureurl', 'avatar', 'picture', 'image_url', 'image']);
    if (!isHttpUrl(avatarUrl)) avatarUrl = '';
    const headline = pickString(record, ['headline', 'sub_title', 'subtitle', 'summary', 'tagline']);
    let industry = pickString(record, ['industry', 'industries']);
    const normalizedIndustry = industry.trim().toLowerCase();
    if (normalizedIndustry === 'undefined' || normalizedIndustry === 'null') industry = '';
    const location = pickString(record, ['location', 'geo_region', 'region', 'city']);
    const followersCount = pickNumber(record, ['followers_count', 'followerscount', 'follower_count', 'followers']);
    const verified = pickBoolean(record, ['verified', 'is_verified']);
    const premium = pickBoolean(record, ['premium', 'is_premium']);
    if (!name && !profileUrl) continue;
    const key = id || profileUrl || name;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id,
      name,
      headline,
      industry,
      location,
      followersCount,
      avatarUrl,
      profileUrl,
      slug,
      verified,
      premium,
      isCompany,
    });
  }
  return items;
}

/**
 * Reattaches sibling `profile_details` / `profile_type` onto an inner `output`
 * object so company vs personal header fields survive unwrapping.
 */
function mergeProfileContext(row: UnknownRecord, inner: unknown): unknown {
  if (!isRecord(inner)) return inner;
  const details = row.profile_details ?? row.profileDetails;
  const type = row.profile_type ?? row.profileType;
  if (details === undefined && type === undefined) return inner;
  const next: UnknownRecord = { ...inner };
  if (details !== undefined && next.profile_details == null && next.profileDetails == null) {
    next.profile_details = details;
  }
  if (type !== undefined && next.profile_type == null && next.profileType == null) {
    next.profile_type = type;
  }
  return next;
}

/**
 * Extracts the intelligence payload from the analyze workflow response
 * (`output.rows[0].output` when present), falling back to the raw value.
 * Preserves `profile_details` from the history/analyze row so company pages
 * keep profile_url, tagline, and logo.
 */
export function extractIntelligencePayload(raw: unknown): unknown {
  const decoded = deepDecode(raw);
  if (!isRecord(decoded)) return raw;

  const tryRows = (container: unknown): unknown | null => {
    const rows = deepDecode(container);
    if (Array.isArray(rows) && rows.length > 0) {
      const first = deepDecode(rows[0]);
      if (isRecord(first) && 'output' in first) {
        return mergeProfileContext(first, deepDecode(first.output));
      }
    }
    return null;
  };

  const output = deepDecode(decoded.output);
  if (isRecord(output)) {
    const fromRows = tryRows(output.rows);
    if (fromRows !== null) return fromRows;
    return mergeProfileContext(decoded, output);
  }

  const fromTopRows = tryRows(decoded.rows);
  if (fromTopRows !== null) return fromTopRows;

  return raw;
}
