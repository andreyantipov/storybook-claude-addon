export const ADDON_ID = 'storybook-addon-claude';
export const PANEL_ID = `${ADDON_ID}/panel`;
export const TOOL_ID = `${ADDON_ID}/tool`;
export const PARAM_KEY = 'claude';

export const EVENTS = {
  SEND_MESSAGE: `${ADDON_ID}/send-message`,
  RECEIVE_CHUNK: `${ADDON_ID}/receive-chunk`,
  STREAM_START: `${ADDON_ID}/stream-start`,
  STREAM_END: `${ADDON_ID}/stream-end`,
  STREAM_ERROR: `${ADDON_ID}/stream-error`,
  CLEAR_CHAT: `${ADDON_ID}/clear-chat`,
} as const;

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant integrated into Storybook.
You can help developers understand components, suggest improvements, debug issues, and provide code examples.
When discussing code, be concise and practical. Use markdown formatting for code blocks.`;

export const WEBSOCKET_PORT = 6007;
