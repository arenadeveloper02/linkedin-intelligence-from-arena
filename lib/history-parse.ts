import type { HistoryEntry } from './types';
import { extractProfileDetailsFromResponse, flattenProfileLayers } from './profile-details';

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
 * Each entry keeps the full history row (`profile_details` + `output`) as payload
 * so the dashboard can show View Profile and company/person header copy.
 * Card fields come from profile_details (company tagline vs personal headline),
 * not from engagement records.
 */
export function parseHistoryRows(raw: unknown): HistoryEntry[] {
  const rows = extractRows(raw);
  const entries: HistoryEntry[] = [];
  rows.forEach((row, index) => {
    const record = deepDecode(row);
    if (!isRecord(record)) return;
    // Keep the full history row (profile_details + output). Dropping
    // profile_details previously hid the company profile_url (View Profile)
    // and let engagement headlines leak into the card description.
    const payload: unknown = record;
    const details = extractProfileDetailsFromResponse(record);
    const detailSources: UnknownRecord[] = [];
    if (isRecord(payload)) {
      const nestedKeys = [
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
      ];
      for (const nestedKey of nestedKeys) {
        const nested = deepDecode((payload as UnknownRecord)[nestedKey]);
        if (isRecord(nested)) detailSources.push(...flattenProfileLayers(nested));
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
    let title = details?.name || pickAcross(['name', 'company', 'company_name', 'companyName']);
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
    let companySlug = details?.slug || pickAcross([
      'company_slug',
      'companySlug',
      'slug',
      'universal_name',
      'universalName',
      'public_identifier',
      'publicIdentifier',
    ]);
    // Subtitle is the LinkedIn profile URL (used by View Profile), never the slug.
    let subtitle = details?.profileUrl || '';
    if (!isHttpUrl(subtitle)) {
      subtitle = pickString(record, [
        'company_profile_url',
        'companyProfileUrl',
        'profile_url',
        'profileUrl',
        'linkedin_url',
        'linkedinUrl',
      ]);
    }
    if (!isHttpUrl(subtitle)) {
      subtitle = pickAcross([
        'company_profile_url',
        'companyProfileUrl',
        'profile_url',
        'profileUrl',
        'linkedin_url',
        'linkedinUrl',
      ]);
    }
    if (!isHttpUrl(subtitle)) subtitle = '';
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
    const logoKeys = details?.isCompany
      ? ['logo', 'logo_large', 'logo_url', 'logoUrl', 'image', 'image_url']
      : [
          'profile_picture_url_large',
          'profile_picture_url',
          'profilePictureUrl',
          'picture',
          'avatar',
          'avatar_url',
        ];
    let logoUrl = details?.logoUrl || pickAcross(logoKeys);
    if (!isHttpUrl(logoUrl)) logoUrl = '';
    // Card description: company tagline vs personal headline — only from profile_details.
    let headline = decodeEscapes(details?.tagline || '');
    if (!headline) {
      headline = decodeEscapes(
        details?.isCompany
          ? pickAcross(['tagline', 'description', 'about'])
          : pickAcross(['headline', 'sub_title', 'subtitle'])
      );
    }
    let industry = details?.industry || pickAcross(['industry', 'industries']);
    const location = details?.location || pickAcross(['location', 'headquarters', 'hq', 'city']);
    let followersCount =
      details?.followersCount ||
      pickNumberAcross(['followers_count', 'follower_count', 'followers', 'followerCount']);
    let entityIsCompany: boolean | null = typeof details?.isCompany === 'boolean' ? details.isCompany : null;
    if (entityIsCompany === null) {
      for (const source of detailSources) {
        const objectType = asString(source.object);
        if (/userprofile|personprofile/i.test(objectType)) {
          entityIsCompany = false;
          break;
        }
        if (/companyprofile/i.test(objectType)) {
          entityIsCompany = true;
          break;
        }
        const flag = source['is_company'] ?? source['isCompany'];
        if (typeof flag === 'boolean') {
          entityIsCompany = flag;
          break;
        }
        if (flag === 'true' || flag === 1 || flag === '1') {
          entityIsCompany = true;
          break;
        }
        if (flag === 'false' || flag === 0 || flag === '0') {
          entityIsCompany = false;
          break;
        }
      }
    }
    if (entityIsCompany === null) {
      const typeStr = pickAcross(['type', 'entity_type', 'entityType', 'profile_type', 'profileType', 'record_type', 'recordType']);
      if (typeStr) {
        if (/person|personal|people|individual|member/i.test(typeStr)) {
          entityIsCompany = false;
        } else if (/company|organization|organisation|business/i.test(typeStr)) {
          entityIsCompany = true;
        }
      }
    }
    if (entityIsCompany === null) {
      const url = subtitle || details?.profileUrl || '';
      if (/linkedin\.com\/in\//i.test(url)) entityIsCompany = false;
      else if (/linkedin\.com\/company\//i.test(url)) entityIsCompany = true;
    }
    const isCompany = entityIsCompany ?? false;
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
      accountId: details?.accountId || '',
      isCompany,
    });
  });
  return entries;
}
