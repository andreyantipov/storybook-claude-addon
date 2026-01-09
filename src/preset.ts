export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./manager')];
}
