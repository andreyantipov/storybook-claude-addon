import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { DEFAULT_SYSTEM_PROMPT, WEBSOCKET_PORT } from '../constants';

interface ClientMessage {
  type: 'message' | 'clear';
  payload?: {
    content: string;
    context?: {
      storyId?: string;
      componentSource?: string;
    };
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10);
const USE_API = !!process.env.ANTHROPIC_API_KEY;

let serverInstance: WebSocketServer | null = null;

export function startClaudeServer(port: number = WEBSOCKET_PORT): WebSocketServer | null {
  if (serverInstance) {
    return serverInstance;
  }

  const mode = USE_API ? 'Anthropic API' : 'Claude CLI';
  console.log(`\n🤖 [Claude Addon] Server started on ws://localhost:${port}`);
  console.log(`   Mode: ${mode}\n`);

  try {
    const wss = new WebSocketServer({ port });
    serverInstance = wss;

    wss.on('connection', (ws: WebSocket) => {
      console.log('[Claude Addon] Client connected');

      let claudeProcess: ChildProcess | null = null;
      const conversationHistory: ChatMessage[] = [];

      ws.on('message', async (data: Buffer) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());

          if (message.type === 'clear') {
            if (claudeProcess) {
              claudeProcess.kill();
              claudeProcess = null;
            }
            conversationHistory.length = 0;
            ws.send(JSON.stringify({ type: 'clear' }));
            return;
          }

          if (message.type === 'message' && message.payload) {
            const { content, context } = message.payload;

            let prompt = content;
            if (context?.storyId) {
              prompt = `[Storybook: ${context.componentSource || context.storyId}]\n\n${content}`;
            }

            const messageId = `msg_${Date.now()}`;
            ws.send(JSON.stringify({ type: 'start', payload: { messageId } }));

            if (USE_API) {
              await handleWithAPI(ws, messageId, prompt, conversationHistory);
            } else {
              claudeProcess = handleWithCLI(ws, messageId, prompt, claudeProcess);
            }
          }
        } catch (error) {
          console.error('[Claude Addon] Error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Failed to process message' },
          }));
        }
      });

      ws.on('close', () => {
        console.log('[Claude Addon] Client disconnected');
        if (claudeProcess) {
          claudeProcess.kill();
        }
      });
    });

    wss.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`[Claude Addon] Port ${port} in use`);
      } else {
        console.error('[Claude Addon] Server error:', error);
      }
    });

    return wss;
  } catch (error) {
    console.error('[Claude Addon] Failed to start:', error);
    return null;
  }
}

// Handle with Claude CLI (no API key needed)
function handleWithCLI(
  ws: WebSocket,
  messageId: string,
  prompt: string,
  existingProcess: ChildProcess | null
): ChildProcess | null {
  if (existingProcess) {
    existingProcess.kill();
  }

  const claudeProcess = spawn('claude', ['--dangerously-skip-permissions', '-p', prompt], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });

  claudeProcess.stdout?.on('data', (chunk: Buffer) => {
    ws.send(JSON.stringify({
      type: 'chunk',
      payload: { messageId, content: chunk.toString(), done: false },
    }));
  });

  claudeProcess.stderr?.on('data', (chunk: Buffer) => {
    console.error('[Claude CLI]', chunk.toString());
  });

  claudeProcess.on('close', () => {
    ws.send(JSON.stringify({ type: 'end', payload: { messageId } }));
  });

  claudeProcess.on('error', (error) => {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { error: `Claude CLI error: ${error.message}. Is 'claude' installed?` },
    }));
  });

  return claudeProcess;
}

// Handle with Anthropic API (requires ANTHROPIC_API_KEY)
async function handleWithAPI(
  ws: WebSocket,
  messageId: string,
  prompt: string,
  history: ChatMessage[]
): Promise<void> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    history.push({ role: 'user', content: prompt });

    const stream = await anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: DEFAULT_SYSTEM_PROMPT,
      messages: history,
    });

    let fullResponse = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          fullResponse += delta.text;
          ws.send(JSON.stringify({
            type: 'chunk',
            payload: { messageId, content: delta.text, done: false },
          }));
        }
      }
    }

    history.push({ role: 'assistant', content: fullResponse });
    ws.send(JSON.stringify({ type: 'end', payload: { messageId } }));
  } catch (error: any) {
    console.error('[Claude API]', error.message);
    ws.send(JSON.stringify({
      type: 'error',
      payload: { error: error.message },
    }));
  }
}

export function stopClaudeServer(): void {
  serverInstance?.close();
  serverInstance = null;
}
