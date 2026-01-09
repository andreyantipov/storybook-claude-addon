import type { Options } from '@storybook/types';
import { startClaudeServer } from './server/claude-server';

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./manager')];
}

// Start WebSocket server when Storybook loads
export async function serverChannel(
  channel: any,
  options: Options & { configDir: string }
) {
  // Start the Claude WebSocket server
  startClaudeServer();
  return channel;
}
