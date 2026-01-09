import { Agent } from '@mastra/core';
import {
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  searchFilesTool,
  runCommandTool,
} from '../tools/filesystem';

const PROJECT_ROOT = process.cwd();

export const storybookAgent = new Agent({
  name: 'storybook-claude',
  instructions: `You are an AI assistant integrated into Storybook for helping developers with their React components.

You have access to the project's file system and can:
- Read and write files
- Search for code patterns
- List directory contents
- Run safe shell commands (lint, test, build, git status)

When helping developers:
1. First understand the context by reading relevant files
2. Analyze the code structure and patterns
3. Provide specific, actionable suggestions
4. Show code examples with proper syntax
5. Be concise but thorough

Project root: ${PROJECT_ROOT}

Always respect the project's existing patterns and conventions.
Format code blocks with proper language tags (typescript, tsx, etc).`,
  model: 'anthropic/claude-sonnet-4-20250514',
  tools: {
    readFileTool,
    writeFileTool,
    listDirectoryTool,
    searchFilesTool,
    runCommandTool,
  },
});
