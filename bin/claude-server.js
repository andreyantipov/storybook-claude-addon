#!/usr/bin/env node

/**
 * Claude Server CLI
 *
 * Starts the WebSocket server for Claude AI integration with Storybook
 *
 * Usage:
 *   npx @andreyantipov/storybook-claude-addon claude-server
 *   # or
 *   npx claude-server
 *
 * Environment variables:
 *   ANTHROPIC_API_KEY - Your Anthropic API key (required)
 *   CLAUDE_WS_PORT - WebSocket port (default: 6007)
 *   CLAUDE_MODEL - Claude model to use (default: claude-sonnet-4-20250514)
 *   CLAUDE_MAX_TOKENS - Maximum tokens per response (default: 4096)
 */

const { WebSocketServer } = require('ws');

const DEFAULT_PORT = parseInt(process.env.CLAUDE_WS_PORT || '6007', 10);
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10);
const API_KEY = process.env.ANTHROPIC_API_KEY;

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant integrated into Storybook.
You can help developers understand components, suggest improvements, debug issues, and provide code examples.
When discussing code, be concise and practical. Use markdown formatting for code blocks.`;

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk').default;
} catch (e) {
  console.error('Error: @anthropic-ai/sdk is not installed.');
  console.error('Please install it with: npm install @anthropic-ai/sdk');
  process.exit(1);
}

class ClaudeServer {
  constructor() {
    this.wss = null;
    this.anthropic = API_KEY ? new Anthropic({ apiKey: API_KEY }) : null;
    this.conversationHistory = new Map();
  }

  start() {
    this.wss = new WebSocketServer({ port: DEFAULT_PORT });

    console.log(`
╔══════════════════════════════════════════════╗
║       Claude Server for Storybook            ║
╠══════════════════════════════════════════════╣
║  Port:    ${String(DEFAULT_PORT).padEnd(34)}║
║  Model:   ${DEFAULT_MODEL.padEnd(34)}║
║  API Key: ${(API_KEY ? '✓ configured' : '✗ missing').padEnd(34)}║
╚══════════════════════════════════════════════╝
`);

    if (!this.anthropic) {
      console.warn('⚠️  Warning: ANTHROPIC_API_KEY not set.');
      console.warn('   Set it with: export ANTHROPIC_API_KEY=your-key\n');
    }

    this.wss.on('connection', (ws) => {
      console.log('📱 Client connected');
      this.conversationHistory.set(ws, []);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'Failed to process message');
        }
      });

      ws.on('close', () => {
        console.log('📴 Client disconnected');
        this.conversationHistory.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    this.wss.on('listening', () => {
      console.log(`✅ Listening on ws://localhost:${DEFAULT_PORT}\n`);
    });

    this.wss.on('error', (error) => {
      console.error('Server error:', error);
    });
  }

  async handleMessage(ws, message) {
    switch (message.type) {
      case 'message':
        await this.handleChatMessage(ws, message.payload);
        break;
      case 'clear':
        this.conversationHistory.set(ws, []);
        ws.send(JSON.stringify({ type: 'clear' }));
        console.log('🗑️  Chat cleared');
        break;
    }
  }

  async handleChatMessage(ws, payload) {
    if (!this.anthropic) {
      this.sendError(ws, 'Claude API key not configured. Set ANTHROPIC_API_KEY environment variable.');
      return;
    }

    const history = this.conversationHistory.get(ws) || [];

    let userContent = payload.content;
    if (payload.context?.storyId) {
      userContent = `[Context: Viewing story "${payload.context.componentSource || payload.context.storyId}"]\n\n${payload.content}`;
    }

    history.push({ role: 'user', content: userContent });
    console.log(`\n💬 User: ${payload.content.substring(0, 100)}${payload.content.length > 100 ? '...' : ''}`);

    const messageId = `msg_${Date.now()}`;
    ws.send(JSON.stringify({ type: 'start', payload: { messageId } }));

    try {
      const stream = await this.anthropic.messages.stream({
        model: DEFAULT_MODEL,
        max_tokens: DEFAULT_MAX_TOKENS,
        system: DEFAULT_SYSTEM_PROMPT,
        messages: history,
      });

      let fullResponse = '';
      process.stdout.write('🤖 Claude: ');

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            fullResponse += delta.text;
            process.stdout.write('.');
            ws.send(JSON.stringify({
              type: 'chunk',
              payload: { messageId, content: delta.text, done: false },
            }));
          }
        }
      }

      console.log(' done\n');
      history.push({ role: 'assistant', content: fullResponse });
      this.conversationHistory.set(ws, history);

      ws.send(JSON.stringify({ type: 'end', payload: { messageId } }));
    } catch (error) {
      console.error('\n❌ API error:', error.message);
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';
      this.sendError(ws, errorMessage);
      history.pop();
    }
  }

  sendError(ws, error) {
    ws.send(JSON.stringify({ type: 'error', payload: { error } }));
  }

  stop() {
    this.wss?.close();
    this.wss = null;
    console.log('\n👋 Server stopped');
  }
}

// Start server
const server = new ClaudeServer();
server.start();

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
