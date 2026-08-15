/** Minimum Independence Day celebration delay while “generating” the report */
export const INDEPENDENCE_LOADER_MS = 3200;

export async function withIndependenceDelay<T>(work: () => Promise<T>, ms = INDEPENDENCE_LOADER_MS): Promise<T> {
  const started = Date.now();
  const result = await work();
  const elapsed = Date.now() - started;
  if (elapsed < ms) {
    await new Promise((r) => setTimeout(r, ms - elapsed));
  }
  return result;
}
