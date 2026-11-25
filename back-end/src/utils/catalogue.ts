/**
 * The published catalogue: every plan the search page and the landing filter, loaded with its days,
 * claims, ratings and live bookings, then shared by every request (each filter runs on it in memory).
 * Any database write clears it (hooks in config/database.ts); the TTL bounds what changes with time
 * alone, such as a bank-transfer hold lapsing and freeing its seats. The seat check at booking time
 * reads the database under a row lock, so a stale copy can only show a seat, never sell one.
 * ponytail: one value per process; move it to Redis if the API ever runs as several processes.
 */
const TTL_MS = 60_000;

let cached: { at: number; value: Promise<unknown> } | null = null;

export const clearCatalogue = () => {
  cached = null;
};

/** The cached catalogue, loading it once when missing or older than the TTL; a failed load isn't kept. */
export function catalogue<T>(load: () => Promise<T>): Promise<T> {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const value = load();
    cached = { at: Date.now(), value };
    value.catch(() => {
      if (cached?.value === value) cached = null;
    });
  }
  return cached.value as Promise<T>;
}
