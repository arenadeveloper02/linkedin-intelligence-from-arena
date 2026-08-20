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

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
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
 * the dashboard can render it directly on selection.
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
    let title = pickString(record, [
      'name',
      'company_name',
      'companyName',
      'search_name',
      'searchName',
      'title',
      'query',
    ]);
    if (!title && isRecord(payload)) {
      title = pickString(payload, ['name', 'company_name', 'companyName']);
      if (!title) {
        const nested = deepDecode(
          (payload as UnknownRecord).company_details ?? (payload as UnknownRecord).company_profile
        );
        if (isRecord(nested)) {
          title = pickString(nested, ['name', 'company_name', 'companyName']);
        }
      }
    }
    const subtitle = pickString(record, [
      'profile_url',
      'profileUrl',
      'linkedin_url',
      'linkedinUrl',
      'url',
      'slug',
      'headline',
    ]);
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
    const rawId = pickString(record, ['id', 'row_id', 'rowId', 'urn']);
    entries.push({
      id: rawId ? `${rawId}-${index}` : `history-${index}`,
      title: title || `History item ${index + 1}`,
      subtitle,
      timestamp,
      payload,
    });
  });
  return entries;
}
