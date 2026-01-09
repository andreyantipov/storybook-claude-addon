import { useState, useCallback, useRef, useEffect } from 'react';
import type { ClaudeMessage, ClaudeChatState, WebSocketMessage, ChunkPayload } from '../types';
import { WEBSOCKET_PORT } from '../constants';

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export interface UseClaudeChatOptions {
  websocketUrl?: string;
  onMessage?: (message: ClaudeMessage) => void;
  onError?: (error: string) => void;
}

export function useClaudeChat(options: UseClaudeChatOptions = {}) {
  const {
    websocketUrl = `ws://localhost:${WEBSOCKET_PORT}`,
    onMessage,
    onError
  } = options;

  const [state, setState] = useState<ClaudeChatState>({
    messages: [],
    isConnected: false,
    isStreaming: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMessageRef = useRef<string>('');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(websocketUrl);

      ws.onopen = () => {
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
        console.log('[Claude Addon] WebSocket connected');
      };

      ws.onclose = () => {
        setState((prev) => ({ ...prev, isConnected: false }));
        console.log('[Claude Addon] WebSocket disconnected');

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        console.error('[Claude Addon] WebSocket error');
        setState((prev) => ({
          ...prev,
          error: 'Connection error. Make sure the Claude server is running.'
        }));
        onError?.('WebSocket connection error');
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('[Claude Addon] Failed to parse message:', e);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Claude Addon] Failed to connect:', error);
      setState((prev) => ({ ...prev, error: 'Failed to connect to Claude server' }));
    }
  }, [websocketUrl, onError]);

  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'start': {
        const messageId = (data.payload as { messageId: string })?.messageId || generateId();
        currentMessageRef.current = '';
        setState((prev) => ({
          ...prev,
          isStreaming: true,
          messages: [
            ...prev.messages,
            {
              id: messageId,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              isStreaming: true,
            },
          ],
        }));
        break;
      }

      case 'chunk': {
        const { content } = data.payload as ChunkPayload;
        currentMessageRef.current += content;

        setState((prev) => {
          const messages = [...prev.messages];
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.content = currentMessageRef.current;
          }
          return { ...prev, messages };
        });
        break;
      }

      case 'end': {
        setState((prev) => {
          const messages = [...prev.messages];
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.isStreaming = false;
            onMessage?.(lastMessage);
          }
          return { ...prev, messages, isStreaming: false };
        });
        currentMessageRef.current = '';
        break;
      }

      case 'error': {
        const errorMessage = (data.payload as { error: string })?.error || 'Unknown error';
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMessage
        }));
        onError?.(errorMessage);
        break;
      }

      case 'clear': {
        setState((prev) => ({ ...prev, messages: [] }));
        break;
      }
    }
  }, [onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((content: string, context?: { storyId?: string; componentSource?: string }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setState((prev) => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    const userMessage: ClaudeMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      error: null,
    }));

    wsRef.current.send(JSON.stringify({
      type: 'message',
      payload: { content, context },
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
    wsRef.current?.send(JSON.stringify({ type: 'clear' }));
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    sendMessage,
    clearChat,
    connect,
    disconnect,
  };
}
