import type { Meta, StoryObj } from '@storybook/react';
import { ClaudeTerminal } from '../components/ClaudeTerminal';

const meta: Meta<typeof ClaudeTerminal> = {
  title: 'Components/ClaudeTerminal',
  component: ClaudeTerminal,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    theme: {
      control: 'select',
      options: ['dark', 'light'],
    },
    fontSize: {
      control: { type: 'range', min: 10, max: 24, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ClaudeTerminal>;

export const Dark: Story = {
  args: {
    theme: 'dark',
    fontSize: 14,
    onInput: (input) => console.log('Input:', input),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: {
    theme: 'light',
    fontSize: 14,
    onInput: (input) => console.log('Input:', input),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const LargeFontSize: Story = {
  args: {
    theme: 'dark',
    fontSize: 18,
    onInput: (input) => console.log('Input:', input),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
