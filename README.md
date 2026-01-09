# Storybook Claude Addon

Storybook addon with Claude AI assistant powered by **AI SDK** and **assistant-ui**. Features a modern chat interface with file system access.

## Features

- **AI SDK Integration**: Uses Anthropic Claude with Vercel AI SDK
- **assistant-ui Chat**: Modern React chat components with streaming
- **Storybook Integration**: Panel and toolbar button for easy access
- **File System Tools**: Read, write, search files in your project
- **Safe Commands**: Run lint, test, build, git status from the chat

## Installation

1. Create `.npmrc`:

```
@andreyantipov:registry=https://npm.pkg.github.com
```

2. Install:

```bash
pnpm add @andreyantipov/storybook-addon-claude
```

3. Add to `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  addons: [
    '@andreyantipov/storybook-addon-claude',
  ],
  // ...
};

export default config;
```

4. Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your-key-here
```

5. Start Storybook!

## Usage

- Click **Claude icon** in toolbar or open the **Claude AI** panel
- Type your message and press **Enter** or click **Send**
- The AI can:
  - Read and analyze your component code
  - Search for patterns across your codebase
  - Suggest improvements
  - Write new files
  - Run lint/test/build commands

## Agent Tools

| Tool | Description |
|------|-------------|
| `readFile` | Read any file in the project |
| `writeFile` | Create or update files |
| `listDirectory` | List files and folders |
| `searchFiles` | Search for code patterns |
| `runCommand` | Run safe commands (lint, test, build, git status) |

## Architecture

The addon uses:
- **@assistant-ui/react** - Chat UI components
- **@assistant-ui/react-ai-sdk** - AI SDK integration
- **@ai-sdk/anthropic** - Claude model provider
- **ai** - Vercel AI SDK core

The HTTP server runs on port 6008 by default and provides the `/api/chat` endpoint for streaming responses.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |

## Ports

| Port | Description |
|------|-------------|
| 6006 | Storybook (default) |
| 6008 | Claude HTTP API server |

## License

MIT
