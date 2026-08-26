import type { HistoryEntry, ProfileDetails } from './types';
import {
  completeProfileDetails,
  extractAccountIdFromResponse,
  extractProfileDetailsFromResponse,
  extractProfileUrlFromResponse,
} from './profile-details';

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

function isCompanyRow(profileType: string, profileUrl: string): boolean {
  if (/^company$/i.test(profileType)) return true;
  if (/person|personal|people|individual|member/i.test(profileType)) return false;
  if (/linkedin\.com\/company\//i.test(profileUrl)) return true;
  if (/linkedin\.com\/in\//i.test(profileUrl)) return false;
  return false;
}

/**
 * Parses the history list workflow (`output.rows`) into cards.
 * List rows are lightweight: id, name, slug, profile_type, profile_url,
 * account_id, created_at. Full intelligence is loaded separately by id.
 */
export function parseHistoryRows(raw: unknown): HistoryEntry[] {
  const rows = extractRows(raw);
  const entries: HistoryEntry[] = [];
  rows.forEach((row, index) => {
    const record = deepDecode(row);
    if (!isRecord(record)) return;
    const id = asString(record.id) || `history-${index}`;
    const title = asString(record.name) || `History item ${index + 1}`;
    const profileUrl = asString(record.profile_url) || asString(record.profileUrl);
    const profileType = asString(record.profile_type) || asString(record.profileType);
    const profileImage =
      asString(record.profile_image) || asString(record.profileImage) || asString(record.logo) || asString(record.logo_url);
    entries.push({
      id,
      title,
      subtitle: isHttpUrl(profileUrl) ? profileUrl : '',
      timestamp: asString(record.created_at) || asString(record.createdAt) || asString(record.created_at_ist),
      logoUrl: isHttpUrl(profileImage) ? profileImage : '',
      headline: '',
      industry: '',
      location: '',
      followersCount: 0,
      companySlug: asString(record.slug),
      accountId: asString(record.account_id) || asString(record.accountId),
      isCompany: isCompanyRow(profileType, profileUrl),
    });
  });
  return entries;
}

/**
 * History-by-id is streamed from Arena as-is. Accept the raw row, an Arena
 * `{ output }` execute wrap, or the older `{ success, data }` proxy wrap.
 */
export function unwrapHistoryItemResponse(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  if (raw.success === false && typeof raw.error === 'string') return raw;
  const output = raw.output;
  if (isRecord(output) && ('profile_details' in output || 'id' in output) && !('rows' in output)) {
    return output;
  }
  if ('data' in raw && raw.data !== undefined && !('profile_details' in raw)) {
    return unwrapHistoryItemResponse(raw.data);
  }
  return raw;
}

export function detailsFromHistoryPayload(payload: unknown, entry: HistoryEntry): ProfileDetails {
  const row = unwrapHistoryItemResponse(payload);
  const detailsSource =
    isRecord(row) && (isRecord(row.profile_details) || isRecord(row.profileDetails))
      ? (row.profile_details ?? row.profileDetails)
      : row;
  const entryProfileUrl = isHttpUrl(entry.subtitle) ? entry.subtitle : '';
  const deepDetails = extractProfileDetailsFromResponse(detailsSource);
  const payloadProfileUrl = extractProfileUrlFromResponse(detailsSource);
  const payloadAccountId = extractAccountIdFromResponse(detailsSource);
  return completeProfileDetails({
    name: deepDetails?.name || entry.title,
    profileUrl: deepDetails?.profileUrl || payloadProfileUrl || entryProfileUrl,
    accountId: deepDetails?.accountId || payloadAccountId || entry.accountId || '',
    slug: deepDetails?.slug || entry.companySlug,
    logoUrl: deepDetails?.logoUrl || entry.logoUrl || '',
    tagline: deepDetails?.tagline || '',
    description: deepDetails?.description || '',
    industry: deepDetails?.industry || '',
    location: deepDetails?.location || '',
    followersCount: deepDetails?.followersCount || 0,
    isCompany: deepDetails?.isCompany ?? entry.isCompany,
  });
}

export function toHistoryWorkflowId(id: string): number | string {
  const trimmed = id.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}
