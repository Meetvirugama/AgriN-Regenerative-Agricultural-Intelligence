/**
 * Minimal in-memory store for data that does not yet have a Postgres table.
 * All farmer/field/crop/weather/soil data lives in Postgres repositories.
 */
export class InMemoryDB {
  /** Cached regenerative agriculture plans keyed by fieldId. */
  regenPlans = new Map();
}

export const db = new InMemoryDB();
