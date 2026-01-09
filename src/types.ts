export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ClaudeChatState {
  messages: ClaudeMessage[];
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface ClaudeConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  websocketUrl?: string;
}

export interface WebSocketMessage {
  type: 'message' | 'chunk' | 'start' | 'end' | 'error' | 'clear';
  payload?: unknown;
}

export interface SendMessagePayload {
  content: string;
  context?: {
    storyId?: string;
    componentSource?: string;
  };
}

export interface ChunkPayload {
  messageId: string;
  content: string;
  done: boolean;
}
