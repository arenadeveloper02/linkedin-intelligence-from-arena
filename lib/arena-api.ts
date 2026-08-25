/** Arena workflow auth. Uses ARENA_API_KEY from the environment. */
export function getArenaApiKey(): string {
  let key = (process.env.ARENA_API_KEY ?? '').trim().replace(/^\uFEFF/, '');
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(key)) {
    key = key.replace(/^bearer\s+/i, '').trim();
  }
  return key;
}

export function arenaAuthHeaders(): Record<string, string> {
  const apiKey = getArenaApiKey();
  if (!apiKey) return {};
  return { 'X-API-Key': apiKey };
}

export function arenaWorkflowError(workflow: string, status: number): string {
  if (status === 401) {
    return `${workflow} returned 401. Arena rejected ARENA_API_KEY. Enable it for Production and Preview (this *.vercel.app URL is usually Preview), do not wrap the value in quotes, then Redeploy.`;
  }
  return `${workflow} failed with status ${status}.`;
}
