import React, { useRef, useCallback, useEffect } from 'react';
import { useStorybookApi } from '@storybook/manager-api';
import { styled, useTheme } from '@storybook/theming';
import { ClaudeTerminal, type ClaudeTerminalRef } from './ClaudeTerminal';
import { useClaudeChat } from '../hooks/useClaudeChat';

const PanelWrapper = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
});

const StatusBar = styled.div<{ isConnected: boolean }>(({ isConnected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '12px',
  '& .status-indicator': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '&::before': {
      content: '""',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: isConnected ? '#0dbc79' : '#cd3131',
    },
  },
}));

const ActionButtons = styled.div({
  display: 'flex',
  gap: '8px',
});

const Button = styled.button({
  padding: '4px 12px',
  fontSize: '11px',
  fontWeight: 500,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'inherit',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const TerminalWrapper = styled.div({
  flex: 1,
  overflow: 'hidden',
});

const ErrorBanner = styled.div({
  padding: '8px 12px',
  backgroundColor: 'rgba(205, 49, 49, 0.2)',
  borderBottom: '1px solid rgba(205, 49, 49, 0.4)',
  color: '#f14c4c',
  fontSize: '12px',
});

interface ClaudePanelProps {
  active?: boolean;
}

export const ClaudePanel: React.FC<ClaudePanelProps> = ({ active }) => {
  const terminalRef = useRef<ClaudeTerminalRef>(null);
  const theme = useTheme();
  const api = useStorybookApi();

  const {
    messages,
    isConnected,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    connect,
  } = useClaudeChat({
    onError: (err) => {
      terminalRef.current?.writeln(`\x1b[1;31mError: ${err}\x1b[0m`);
      terminalRef.current?.write('\x1b[1;32m>\x1b[0m ');
    },
  });

  // Handle incoming stream chunks
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
      const lines = lastMessage.content.split('\n');
      terminalRef.current?.write(`\r\x1b[K\x1b[1;35mClaude:\x1b[0m ${lines[lines.length - 1]}`);
    }
  }, [messages]);

  const handleInput = useCallback((input: string) => {
    if (!input.trim()) return;

    const currentStory = api.getCurrentStoryData();
    const context = currentStory ? {
      storyId: currentStory.id,
      componentSource: currentStory.title,
    } : undefined;

    terminalRef.current?.writeln(`\x1b[1;33mYou:\x1b[0m ${input}`);

    sendMessage(input, context);

    if (!isConnected) {
      terminalRef.current?.writeln('\x1b[1;31mNot connected to Claude server. Reconnecting...\x1b[0m');
      connect();
    }
  }, [sendMessage, isConnected, connect, api]);

  const handleClear = useCallback(() => {
    terminalRef.current?.clear();
    terminalRef.current?.writeln('\x1b[1;36m--- Chat cleared ---\x1b[0m');
    terminalRef.current?.writeln('');
    terminalRef.current?.write('\x1b[1;32m>\x1b[0m ');
    clearChat();
  }, [clearChat]);

  // When stream ends, show prompt
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !lastMessage.isStreaming && !isStreaming) {
      terminalRef.current?.writeln('');
      terminalRef.current?.write('\x1b[1;32m>\x1b[0m ');
    }
  }, [messages, isStreaming]);

  if (!active) return null;

  const terminalTheme = theme.base === 'dark' ? 'dark' : 'light';

  return (
    <PanelWrapper>
      <StatusBar isConnected={isConnected}>
        <div className="status-indicator">
          {isConnected ? 'Connected' : 'Disconnected'}
          {isStreaming && ' (streaming...)'}
        </div>
        <ActionButtons>
          <Button onClick={handleClear} disabled={isStreaming}>
            Clear
          </Button>
          {!isConnected && (
            <Button onClick={connect}>
              Reconnect
            </Button>
          )}
        </ActionButtons>
      </StatusBar>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <TerminalWrapper>
        <ClaudeTerminal
          ref={terminalRef}
          theme={terminalTheme}
          onInput={handleInput}
        />
      </TerminalWrapper>
    </PanelWrapper>
  );
};
