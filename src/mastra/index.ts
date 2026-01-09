import { Mastra } from '@mastra/core';
import { storybookAgent } from './agents/storybook';

export const mastra = new Mastra({
  agents: {
    storybookAgent,
  },
});

export { storybookAgent };
