# Storybook Claude Addon

A Storybook addon that integrates Claude AI assistant with xterm.js terminal interface and real-time streaming.

## Features

- **xterm.js Terminal** - Full terminal interface for interacting with Claude
- **WebSocket Streaming** - Real-time streaming responses from Claude API
- **Context Awareness** - Automatically includes current story context in conversations
- **Light/Dark Theme** - Automatically matches Storybook theme
- **Conversation History** - Maintains chat history per session

## Installation

### From GitHub Packages

1. Create `.npmrc` in your project root:

```
@andreyantipov:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Install the package:

```bash
npm install @andreyantipov/storybook-claude-addon
# or
pnpm add @andreyantipov/storybook-claude-addon
```

3. Add to your `.storybook/main.ts`:

```typescript
const config: StorybookConfig = {
  addons: [
    // ... other addons
    '@andreyantipov/storybook-claude-addon',
  ],
};
```

## Usage

### 1. Start the Claude Server

Before using the addon, start the WebSocket server:

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-api-key-here

# Start the server
npx @andreyantipov/storybook-claude-addon claude-server
```

### 2. Start Storybook

In another terminal:

```bash
npm run storybook
```

### 3. Use the Addon

- Click the **Claude icon** in the Storybook toolbar to open the panel
- Or navigate to the **"Claude AI"** tab in the addons panel
- Type your message and press **Enter**

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `CLAUDE_WS_PORT` | WebSocket server port | `6007` |
| `CLAUDE_MODEL` | Claude model to use | `claude-sonnet-4-20250514` |
| `CLAUDE_MAX_TOKENS` | Max tokens per response | `4096` |

## Publishing to GitHub Packages

### 1. Authenticate with GitHub Packages

```bash
npm login --registry=https://npm.pkg.github.com
```

### 2. Build and Publish

```bash
npm run build
npm publish
```

### GitHub Actions (CI/CD)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to GitHub Packages

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Integration with TDK Frontend

### 1. Add to package.json

```json
{
  "dependencies": {
    "@andreyantipov/storybook-claude-addon": "^1.0.0"
  }
}
```

### 2. Add to Storybook config

In `packages/libs/storybook-host/.storybook/main.ts`:

```typescript
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    // ... other addons
    '@andreyantipov/storybook-claude-addon',
  ],
};
```

### 3. Run the server alongside Storybook

```bash
# Terminal 1: Start Claude server
ANTHROPIC_API_KEY=your-key npx @andreyantipov/storybook-claude-addon claude-server

# Terminal 2: Start Storybook
pnpm storybook
```

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run dev
```

### Run server locally

```bash
npm run server
```

## Architecture

```
storybook-claude-addon/
├── bin/
│   └── claude-server.js      # CLI server entry point
├── src/
│   ├── components/
│   │   ├── ClaudePanel.tsx   # Main panel component
│   │   └── ClaudeTerminal.tsx # xterm.js terminal
│   ├── hooks/
│   │   └── useClaudeChat.ts  # WebSocket chat hook
│   ├── constants.ts          # Addon constants
│   ├── types.ts              # TypeScript types
│   ├── index.ts              # Main exports
│   ├── manager.tsx           # Storybook manager registration
│   └── preset.ts             # Storybook preset
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Terminal Commands

- **Enter** - Send message
- **Backspace** - Delete character
- **Ctrl+C** - Cancel input

## Troubleshooting

### "Not connected to server"

Make sure the Claude server is running:

```bash
ANTHROPIC_API_KEY=your-key npx @andreyantipov/storybook-claude-addon claude-server
```

### "API key not configured"

Set the `ANTHROPIC_API_KEY` environment variable before starting the server.

## License

MIT
