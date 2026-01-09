import React, { useState } from 'react';
import { styled } from '@storybook/theming';
import { AssistantChat } from './AssistantChat';
import { MASTRA_PORT } from '../constants';

const PanelWrapper = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
});

const TabBar = styled.div({
  display: 'flex',
  borderBottom: '1px solid #333',
  backgroundColor: '#1e1e1e',
  flexShrink: 0,
});

const Tab = styled.button<{ active: boolean }>(({ active }) => ({
  padding: '10px 20px',
  border: 'none',
  backgroundColor: active ? '#2d2d2d' : 'transparent',
  color: active ? '#fff' : '#999',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  borderBottom: active ? '2px solid #0066cc' : '2px solid transparent',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: active ? '#2d2d2d' : '#252525',
    color: '#fff',
  },
}));

const TabContent = styled.div({
  flex: 1,
  overflow: 'hidden',
});

const IframeWrapper = styled.div({
  width: '100%',
  height: '100%',
  backgroundColor: '#1e1e1e',
});

const StyledIframe = styled.iframe({
  width: '100%',
  height: '100%',
  border: 'none',
});

const ConnectionMessage = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#999',
  textAlign: 'center',
  padding: '32px',
  '& h3': {
    margin: '0 0 16px 0',
    color: '#ccc',
    fontSize: '16px',
  },
  '& p': {
    margin: '0 0 8px 0',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  '& code': {
    backgroundColor: '#333',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
});

interface ClaudePanelProps {
  active?: boolean;
}

type TabType = 'chat' | 'mastra';

export const ClaudePanel: React.FC<ClaudePanelProps> = ({ active }) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [mastraLoaded, setMastraLoaded] = useState(false);
  const [mastraError, setMastraError] = useState(false);

  if (!active) return null;

  const mastraUrl = `http://localhost:${MASTRA_PORT}`;

  return (
    <PanelWrapper>
      <TabBar>
        <Tab
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </Tab>
        <Tab
          active={activeTab === 'mastra'}
          onClick={() => setActiveTab('mastra')}
        >
          Mastra Dev
        </Tab>
      </TabBar>
      <TabContent>
        {activeTab === 'chat' && <AssistantChat />}
        {activeTab === 'mastra' && (
          <IframeWrapper>
            {mastraError ? (
              <ConnectionMessage>
                <h3>Mastra Dev Server Not Running</h3>
                <p>Start the Mastra dev server to see the agent playground:</p>
                <p><code>npm run mastra:dev</code></p>
                <p style={{ marginTop: '16px' }}>Or run both Mastra and Storybook together:</p>
                <p><code>npm run dev</code></p>
              </ConnectionMessage>
            ) : (
              <StyledIframe
                src={mastraUrl}
                title="Mastra Dev UI"
                onLoad={() => setMastraLoaded(true)}
                onError={() => setMastraError(true)}
              />
            )}
          </IframeWrapper>
        )}
      </TabContent>
    </PanelWrapper>
  );
};
