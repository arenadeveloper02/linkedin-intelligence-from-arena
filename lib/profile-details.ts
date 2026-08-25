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
    const value = asString(record[key]);
    if (value) return value;
  }
  return '';
}

/**
 * Reads a `profile_details`-shaped record into a ProfileDetails object.
 * Intentionally does NOT read a bare `id` field so a row id (e.g. "11")
 * is never mistaken for a LinkedIn account_id.
 */
function readDetails(record: UnknownRecord): ProfileDetails | null {
  const name = firstString(record, ['name', 'company', 'company_name', 'companyName']);
  const rawProfileUrl = firstString(record, [
    'profile_url',
    'profileUrl',
    'company_profile_url',
    'companyProfileUrl',
    'linkedin_url',
    'linkedinUrl',
    'url',
  ]);
  const accountId = firstString(record, ['account_id', 'accountId']);
  const slug = firstString(record, ['slug', 'company_slug', 'companySlug', 'universal_name', 'universalName']);
  const rawLogo = firstString(record, [
    'logo',
    'logo_url',
    'logoUrl',
    'profile_picture_url',
    'profilePictureUrl',
    'image',
    'image_url',
    'avatar',
    'avatar_url',
  ]);
  const tagline = firstString(record, ['tagline', 'headline', 'description', 'about', 'summary']);
  const profileUrl = isHttpUrl(rawProfileUrl) ? rawProfileUrl : '';
  const logoUrl = isHttpUrl(rawLogo) ? rawLogo : '';
  if (!name && !profileUrl && !accountId) return null;
  return { name, profileUrl, accountId, slug, logoUrl, tagline };
}

/**
 * Deep-searches an Analyze/History workflow response (including double-JSON-encoded
 * strings and nested `output.rows[n]` structures) for a `profile_details` object and
 * extracts the canonical identifiers (profile_url, account_id, slug, name, logo,
 * tagline). Also checks `company_details` / `company_profile` sections so history
 * payloads without a `profile_details` wrapper still yield profile_url / account_id.
 * Used so Refresh can rebuild the Analyze payload without empty fields.
 */
export function extractProfileDetailsFromResponse(raw: unknown, depth = 8): ProfileDetails | null {
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
  for (const key of [
    'profile_details',
    'profileDetails',
    'company_details',
    'companyDetails',
    'company_profile',
    'companyProfile',
  ]) {
    if (key in decoded) {
      const nested = deepDecode(decoded[key]);
      if (isRecord(nested)) {
        const details = readDetails(nested);
        if (details) return details;
      }
    }
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

const ACCOUNT_ID_KEYS = ['account_id', 'accountId'];

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

/**
 * Deep-searches a stored history/analyze payload for a usable LinkedIn profile URL
 * (`profile_url` / `company_profile_url` at any nesting level, e.g.
 * `company_details.profile_url` or `output.company_profile.profile_url`).
 */
export function extractProfileUrlFromResponse(raw: unknown, depth = 8): string {
  return deepFindKeyValue(raw, PROFILE_URL_KEYS, true, depth);
}

/**
 * Deep-searches a stored history/analyze payload for the LinkedIn `account_id`
 * so the Refresh payload never sends an empty account_id.
 */
export function extractAccountIdFromResponse(raw: unknown, depth = 8): string {
  return deepFindKeyValue(raw, ACCOUNT_ID_KEYS, false, depth);
}
