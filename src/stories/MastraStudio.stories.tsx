import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { styled } from '@storybook/theming';
import { MASTRA_PORT } from '../constants';

const IframeContainer = styled.div({
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

const StyledIframe = styled.iframe({
  width: '100%',
  height: '100%',
  border: 'none',
  flex: 1,
});

const ErrorMessage = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  backgroundColor: '#1e1e1e',
  color: '#999',
  textAlign: 'center',
  padding: '32px',
  '& h2': {
    margin: '0 0 16px 0',
    color: '#ccc',
    fontSize: '20px',
  },
  '& p': {
    margin: '0 0 8px 0',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  '& code': {
    backgroundColor: '#333',
    padding: '4px 12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    display: 'inline-block',
    margin: '8px 0',
  },
});

interface MastraStudioProps {
  port?: number;
}

const MastraStudio: React.FC<MastraStudioProps> = ({ port = MASTRA_PORT }) => {
  const [error, setError] = React.useState(false);
  const mastraUrl = `http://localhost:${port}`;

  if (error) {
    return (
      <IframeContainer>
        <ErrorMessage>
          <h2>Mastra Dev Server Not Running</h2>
          <p>Start the Mastra dev server to see the agent playground:</p>
          <code>npm run mastra:dev</code>
          <p style={{ marginTop: '16px' }}>Or run both Mastra and Storybook together:</p>
          <code>npm run dev</code>
          <p style={{ marginTop: '24px', color: '#666' }}>
            Mastra Studio runs at <strong>http://localhost:{port}</strong>
          </p>
        </ErrorMessage>
      </IframeContainer>
    );
  }

  return (
    <IframeContainer>
      <StyledIframe
        src={mastraUrl}
        title="Mastra Studio"
        onError={() => setError(true)}
      />
    </IframeContainer>
  );
};

const meta: Meta<typeof MastraStudio> = {
  title: 'Tools/Mastra Studio',
  component: MastraStudio,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Embedded Mastra Studio for agent development and testing. Run `npm run dev` to start both Mastra and Storybook together.',
      },
    },
  },
  argTypes: {
    port: {
      control: 'number',
      description: 'Mastra dev server port',
      defaultValue: MASTRA_PORT,
    },
  },
};

export default meta;
type Story = StoryObj<typeof MastraStudio>;

export const Default: Story = {
  args: {
    port: MASTRA_PORT,
  },
};

export const AgentPlayground: Story = {
  name: 'Agent Playground',
  args: {
    port: MASTRA_PORT,
  },
  parameters: {
    docs: {
      description: {
        story: 'The Mastra Agent Playground allows you to test the storybookAgent with all its tools (readFile, writeFile, listDirectory, searchFiles, runCommand).',
      },
    },
  },
};
