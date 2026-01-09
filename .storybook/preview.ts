import type { Preview } from '@storybook/react';
import { startClaudeServer } from '../src/server/claude-server';

// Start the Claude server when Storybook loads
startClaudeServer();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
