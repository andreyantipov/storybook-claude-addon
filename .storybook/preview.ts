import type { Preview } from '@storybook/react';

// Note: Claude server is started automatically by the preset (Node.js side)
// This preview file runs in the browser

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
