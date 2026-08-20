import type { HistoryEntry } from './types';

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

/**
 * Decodes literal escape sequences that survived JSON parsing (e.g. "\\u270D"
 * showing up as raw text instead of the \u270D emoji character). Handles BMP
 * code points and surrogate pairs since consecutive \uD8xx\uDCxx sequences
 * combine naturally via String.fromCharCode.
 */
function decodeEscapes(value: string): string {
  if (!value.includes('\\')) return value;
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\//g, '/');
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

/**
 * Recursively searches deeply nested (and possibly double-JSON-encoded)
 * structures for the first non-empty string matching one of the given keys.
 * Used as a fallback so history cards can surface `profile_details.name`,
 * `output.company_profile.logo`, `profile_picture_url` etc. no matter how
 * deep the workflow response nests them.
 */
function deepFindString(value: unknown, keys: string[], depth = 6): string {
  if (depth <= 0) return '';
  const decoded = deepDecode(value);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const found = deepFindString(item, keys, depth - 1);
      if (found) return found;
    }
    return '';
  }
  if (!isRecord(decoded)) return '';
  const direct = pickString(decoded, keys);
  if (direct) return direct;
  for (const nested of Object.values(decoded)) {
    if (typeof nested === 'string') {
      const trimmed = nested.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    }
    const found = deepFindString(nested, keys, depth - 1);
    if (found) return found;
  }
  return '';
}

function deepFindNumber(value: unknown, keys: string[], depth = 6): number {
  if (depth <= 0) return 0;
  const decoded = deepDecode(value);
  if (Array.isArray(decoded)) {
    for (const item of decoded) {
      const found = deepFindNumber(item, keys, depth - 1);
      if (found !== 0) return found;
    }
    return 0;
  }
  if (!isRecord(decoded)) return 0;
  const direct = pickNumber(decoded, keys);
  if (direct !== 0) return direct;
  for (const nested of Object.values(decoded)) {
    if (typeof nested === 'string') {
      const trimmed = nested.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    }
    const found = deepFindNumber(nested, keys, depth - 1);
    if (found !== 0) return found;
  }
  return 0;
}

function extractRows(raw: unknown): unknown[] {
  const decoded = deepDecode(raw);
  if (Array.isArray(decoded)) return decoded;
  if (!isRecord(decoded)) return [];
  const output = deepDecode(decoded.output);
  if (Array.isArray(output)) return output;
  if (isRecord(output)) {
    const rows = deepDecode(output.rows);
    if (Array.isArray(rows)) return rows;
  }
  const topRows = deepDecode(decoded.rows);
  if (Array.isArray(topRows)) return topRows;
  return [];
}

/**
 * Parses the intelligence history workflow response (`output.rows`) into cards.
 * Each entry keeps the raw dataset (`output` / `company_details`) as payload so
 * the dashboard can render it directly on selection. Card display fields
 * (title, logo, headline, industry, followers) are sourced from the
 * `profile_details` / `company_details` / `company_profile` objects when present,
 * with a deep recursive fallback for arbitrarily nested payloads.
 */
export function parseHistoryRows(raw: unknown): HistoryEntry[] {
  const rows = extractRows(raw);
  const entries: HistoryEntry[] = [];
  rows.forEach((row, index) => {
    const record = deepDecode(row);
    if (!isRecord(record)) return;
    let payload: unknown = record;
    if ('output' in record) {
      payload = deepDecode(record.output);
    } else if ('company_details' in record) {
      payload = deepDecode(record.company_details);
    }
    const detailSources: UnknownRecord[] = [];
    if (isRecord(payload)) {
      const nestedKeys = [
        'profile_details',
        'profileDetails',
        'company_details',
        'companyDetails',
        'company_profile',
        'companyProfile',
      ];
      for (const nestedKey of nestedKeys) {
        const nested = deepDecode((payload as UnknownRecord)[nestedKey]);
        if (isRecord(nested)) detailSources.push(nested);
      }
      detailSources.push(payload);
    }
    detailSources.push(record);
    const pickAcross = (keys: string[]): string => {
      for (const source of detailSources) {
        const value = pickString(source, keys);
        if (value) return value;
      }
      return '';
    };
    const pickNumberAcross = (keys: string[]): number => {
      for (const source of detailSources) {
        const value = pickNumber(source, keys);
        if (value !== 0) return value;
      }
      return 0;
    };
    // Title comes from `profile_details.name` first, then `company_details.company`
    // / `company_details.name` style fields across the detail sources.
    let title = pickAcross(['name', 'company', 'company_name', 'companyName']);
    if (!title) {
      title = pickString(record, [
        'name',
        'company_name',
        'companyName',
        'company',
        'alias',
        'search_name',
        'searchName',
        'title',
        'query',
      ]);
    }
    if (!title) {
      title = pickAcross(['alias', 'search_name', 'searchName', 'title', 'query']);
    }
    // Deep fallback: search the entire payload/record tree for an entity name
    // so cards never fall back to the generic "History item N" label when a
    // name exists anywhere in the nested workflow response.
    if (!title) {
      title = deepFindString(payload, ['name', 'company', 'company_name', 'companyName']);
    }
    if (!title) {
      title = deepFindString(record, ['name', 'company', 'company_name', 'companyName', 'alias', 'search_name', 'title', 'query']);
    }
    // The company slug (e.g. "position2") is surfaced as a subtitle/tag on the card.
    let companySlug = pickAcross([
      'company_slug',
      'companySlug',
      'slug',
      'universal_name',
      'universalName',
    ]);
    if (!companySlug) {
      companySlug = deepFindString(payload, ['company_slug', 'companySlug', 'universal_name', 'universalName', 'slug']);
    }
    let subtitle = pickString(record, [
      'company_profile_url',
      'companyProfileUrl',
      'profile_url',
      'profileUrl',
      'linkedin_url',
      'linkedinUrl',
      'url',
      'slug',
      'headline',
    ]);
    if (!subtitle) {
      subtitle = pickAcross([
        'company_profile_url',
        'companyProfileUrl',
        'profile_url',
        'linkedin_url',
        'url',
        'alias',
      ]);
    }
    const timestamp = pickString(record, [
      'created_at',
      'createdAt',
      'executed_at',
      'executedAt',
      'timestamp',
      'date',
      'updated_at',
      'updatedAt',
    ]);
    // Logo/avatar extraction covers company_details.logo, company_profile.logo
    // and profile_picture_url style fields across the detail sources.
    const logoKeys = [
      'logo',
      'logo_url',
      'logoUrl',
      'image',
      'image_url',
      'profile_picture',
      'profile_picture_url',
      'profilePictureUrl',
      'avatar',
      'avatar_url',
      'avatarUrl',
    ];
    let logoUrl = pickAcross(logoKeys);
    if (!isHttpUrl(logoUrl)) logoUrl = '';
    // Deep fallback: pull the logo from anywhere in the nested payload (e.g.
    // `output.company_profile.logo`). Falls back to '' so the UI renders the
    // initials placeholder cleanly.
    if (!logoUrl) {
      const deepLogo = deepFindString(payload, logoKeys);
      if (isHttpUrl(deepLogo)) logoUrl = deepLogo;
    }
    if (!logoUrl) {
      const deepLogo = deepFindString(record, logoKeys);
      if (isHttpUrl(deepLogo)) logoUrl = deepLogo;
    }
    let headline = decodeEscapes(pickAcross(['headline', 'tagline', 'description', 'about', 'summary']));
    if (!headline) {
      headline = decodeEscapes(deepFindString(payload, ['headline', 'tagline', 'description', 'about', 'summary']));
    }
    let industry = pickAcross(['industry', 'industries']);
    if (!industry) {
      industry = deepFindString(payload, ['industry', 'industries']);
    }
    const location = pickAcross(['location', 'headquarters', 'hq', 'city']);
    let followersCount = pickNumberAcross(['followers_count', 'follower_count', 'followers', 'followerCount']);
    if (followersCount === 0) {
      followersCount = deepFindNumber(payload, ['followers_count', 'follower_count', 'followers', 'followerCount']);
    }
    const rawId = pickString(record, ['id', 'row_id', 'rowId', 'urn']);
    entries.push({
      id: rawId ? `${rawId}-${index}` : `history-${index}`,
      title: decodeEscapes(title) || `History item ${index + 1}`,
      subtitle,
      timestamp,
      payload,
      logoUrl,
      headline,
      industry,
      location,
      followersCount,
      companySlug,
    });
  });
  return entries;
}
