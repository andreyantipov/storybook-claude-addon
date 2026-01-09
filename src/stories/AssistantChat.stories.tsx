import type { Meta, StoryObj } from '@storybook/react';
import { AssistantChat } from '../components/AssistantChat';

const meta: Meta<typeof AssistantChat> = {
  title: 'Components/AssistantChat',
  component: AssistantChat,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AssistantChat>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '500px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const FullHeight: Story = {
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
