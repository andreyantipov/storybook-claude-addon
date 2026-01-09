// Storybook addon preset - provides manager entries only
// Mastra is now started via Nx (npm run dev runs both in parallel)

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./manager')];
}
