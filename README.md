# Storybook Claude Addon

Storybook addon with Claude AI terminal (xterm.js) and streaming. Works with **Claude CLI** or **Anthropic API**.

## Installation

1. Create `.npmrc`:

```
@andreyantipov:registry=https://npm.pkg.github.com
```

2. Install:

```bash
pnpm add @andreyantipov/storybook-claude-addon
```

3. Add to `.storybook/main.ts`:

```typescript
addons: [
  '@andreyantipov/storybook-claude-addon',
]
```

4. Start Storybook!

## Modes

| Mode | Requirement | Set |
|------|-------------|-----|
| **Claude CLI** (default) | `claude` installed | Nothing |
| **Anthropic API** | API key | `ANTHROPIC_API_KEY=...` |

## Usage

- Click **Claude icon** in toolbar
- Type message, press **Enter**

## License

MIT
