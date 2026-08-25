/** Arena workflow auth. Uses ARENA_API_KEY from the environment. */
export function getArenaApiKey(): string {
  return (process.env.ARENA_API_KEY ?? '').trim();
}

export function arenaAuthHeaders(): Record<string, string> {
  const apiKey = getArenaApiKey();
  if (!apiKey) return {};
  return { 'X-API-Key': apiKey };
}
