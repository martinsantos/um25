import { isNamedClient } from './catalogEditorial';
import { clientKey } from './catalogFilters';

export function clientsForStories(stories: readonly { client: string; year: number }[]) {
  const clients = new Map<string, { name: string; count: number; years: Set<number> }>();
  for (const {client, year} of stories) {
    if (!isNamedClient(client)) continue;
    const key = clientKey(client);
    if (!key) continue;
    const row = clients.get(key) ?? { name: client, count: 0, years: new Set<number>() };
    row.count++;
    if (year > 0) row.years.add(year);
    clients.set(key, row);
  }
  return [...clients.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));
}
