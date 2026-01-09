import React, { useMemo, useState } from 'react';
import { styled } from '@storybook/theming';
import { MASTRA_PORT } from '../constants';

const ChatContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px',
});

const MessagesContainer = styled.div({
  flex: 1,
  overflow: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const MessageWrapper = styled.div<{ role: 'user' | 'assistant' }>(({ role }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  maxWidth: '85%',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
}));

const MessageBubble = styled.div<{ role: 'user' | 'assistant' }>(({ role }) => ({
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: role === 'user' ? '#0066cc' : '#2d2d2d',
  color: role === 'user' ? '#ffffff' : '#d4d4d4',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.5,
  '& code': {
    backgroundColor: role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  '& pre': {
    backgroundColor: '#1a1a1a',
    padding: '12px',
    borderRadius: '8px',
    overflow: 'auto',
    margin: '8px 0',
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  },
}));

const RoleLabel = styled.span<{ role: 'user' | 'assistant' }>(({ role }) => ({
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '4px',
  color: role === 'user' ? '#66b3ff' : '#9966cc',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const ComposerContainer = styled.div({
  display: 'flex',
  gap: '12px',
  padding: '16px',
  borderTop: '1px solid #333',
  backgroundColor: '#252525',
});

const InputWrapper = styled.div({
  flex: 1,
  position: 'relative',
});

const StyledInput = styled.textarea({
  width: '100%',
  padding: '12px 16px',
  paddingRight: '80px',
  borderRadius: '8px',
  border: '1px solid #404040',
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
  fontSize: '14px',
  fontFamily: 'inherit',
  resize: 'none',
  minHeight: '48px',
  maxHeight: '120px',
  outline: 'none',
  transition: 'border-color 0.2s',
  '&:focus': {
    borderColor: '#0066cc',
  },
  '&::placeholder': {
    color: '#666',
  },
});

const SendButton = styled.button({
  position: 'absolute',
  right: '8px',
  bottom: '8px',
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#0066cc',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s, opacity 0.2s',
  '&:hover': {
    backgroundColor: '#0077ee',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

const EmptyState = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#666',
  textAlign: 'center',
  padding: '32px',
  '& h3': {
    margin: '0 0 8px 0',
    color: '#999',
    fontSize: '18px',
    fontWeight: 500,
  },
  '& p': {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5,
  },
});

const LoadingDots = styled.span({
  '&::after': {
    content: '"..."',
    animation: 'dots 1.5s steps(4, end) infinite',
  },
  '@keyframes dots': {
    '0%, 20%': { content: '""' },
    '40%': { content: '"."' },
    '60%': { content: '".."' },
    '80%, 100%': { content: '"..."' },
  },
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Simple chat component without assistant-ui (more stable)
export const AssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const apiUrl = useMemo(() =>
    `http://localhost:${MASTRA_PORT}/api/agents/storybookAgent/stream`,
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              // Handle different streaming formats
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
              } else if (parsed.content) {
                fullContent += parsed.content;
              } else if (typeof parsed === 'string') {
                fullContent += parsed;
              }

              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            } catch {
              // Not JSON, might be raw text
              if (data && data !== '[DONE]') {
                fullContent += data;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}. Make sure Mastra is running at ${apiUrl}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <h3>Claude AI Assistant</h3>
            <p>
              Ask me about your components, code patterns, or anything else.
              <br />
              I can read files, search code, and run commands.
            </p>
          </EmptyState>
        ) : (
          messages.map(message => (
            <MessageWrapper key={message.id} role={message.role}>
              <RoleLabel role={message.role}>
                {message.role === 'user' ? 'You' : 'Claude'}
              </RoleLabel>
              <MessageBubble role={message.role}>
                {message.content || (isLoading && message.role === 'assistant' ? <LoadingDots /> : '')}
              </MessageBubble>
            </MessageWrapper>
          ))
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ComposerContainer>
        <InputWrapper>
          <StyledInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude anything..."
            rows={1}
            disabled={isLoading}
          />
          <SendButton onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? '...' : 'Send'}
          </SendButton>
        </InputWrapper>
      </ComposerContainer>
    </ChatContainer>
  );
};

export default AssistantChat;
