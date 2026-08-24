import type { DashboardData } from './types';
import { parseWorkflowResponse } from './parse';
import { extractIntelligencePayload } from './search-parse';

const EMPTY_DASHBOARD: DashboardData = { company: null, posts: [], people: [], engagements: [] };

/**
 * Safely parses a workflow response (analyze workflow
 * 3909ec63-faf0-4d69-abd1-499bc7b158d0 or a stored history payload) into
 * DashboardData.
 *
 * - Yields to the event loop before parsing so very large double-encoded
 *   payloads (e.g. `users_profile_data.values` and expanded
 *   `engagementRecords`) never block the paint of the loading state.
 * - Wraps every parse pass in try/catch so missing or null person-level
 *   fields degrade gracefully to an empty dashboard instead of throwing
 *   runtime errors during data array transformations.
 */
export async function safeParseWorkflowResponse(raw: unknown): Promise<DashboardData> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  try {
    const payload = extractIntelligencePayload(raw);
    let parsed = parseWorkflowResponse(payload);
    if (!parsed.company && parsed.posts.length === 0 && parsed.people.length === 0) {
      parsed = parseWorkflowResponse(raw);
    }
    return parsed;
  } catch {
    try {
      return parseWorkflowResponse(raw);
    } catch {
      return { ...EMPTY_DASHBOARD, posts: [], people: [], engagements: [] };
    }
  }
}
