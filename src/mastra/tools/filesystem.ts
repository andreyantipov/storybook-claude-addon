import { createTool } from '@mastra/core';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Get project root (where Storybook is running from)
const PROJECT_ROOT = process.cwd();

// Tool: Read file from project
export const readFileTool = createTool({
  id: 'read_file',
  description: 'Read the contents of a file from the project. Use relative paths from project root.',
  inputSchema: z.object({
    filePath: z.string().describe('Relative path to the file from project root'),
  }),
  execute: async ({ context }) => {
    const { filePath } = context as { filePath: string };
    const fullPath = path.resolve(PROJECT_ROOT, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { error: 'Access denied: path outside project root' };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        path: filePath,
        content,
        size: content.length,
      };
    } catch (error: any) {
      return { error: `Failed to read file: ${error.message}` };
    }
  },
});

// Tool: Write file to project
export const writeFileTool = createTool({
  id: 'write_file',
  description: 'Write content to a file in the project. Creates directories if needed.',
  inputSchema: z.object({
    filePath: z.string().describe('Relative path to the file from project root'),
    content: z.string().describe('Content to write to the file'),
  }),
  execute: async ({ context }) => {
    const { filePath, content } = context as { filePath: string; content: string };
    const fullPath = path.resolve(PROJECT_ROOT, filePath);

    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { error: 'Access denied: path outside project root' };
    }

    try {
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf-8');
      return {
        path: filePath,
        success: true,
        size: content.length,
      };
    } catch (error: any) {
      return { error: `Failed to write file: ${error.message}` };
    }
  },
});

// Tool: List directory contents
export const listDirectoryTool = createTool({
  id: 'list_directory',
  description: 'List files and directories in a given path. Use relative paths from project root.',
  inputSchema: z.object({
    dirPath: z.string().default('.').describe('Relative path to the directory'),
    recursive: z.boolean().default(false).describe('Whether to list recursively'),
  }),
  execute: async ({ context }) => {
    const { dirPath, recursive } = context as { dirPath: string; recursive: boolean };
    const fullPath = path.resolve(PROJECT_ROOT, dirPath);

    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { error: 'Access denied: path outside project root' };
    }

    try {
      const items: string[] = [];

      function listDir(dir: string, prefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          // Skip node_modules and hidden files
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

          const relativePath = path.join(prefix, entry.name);
          items.push(entry.isDirectory() ? `${relativePath}/` : relativePath);

          if (recursive && entry.isDirectory()) {
            listDir(path.join(dir, entry.name), relativePath);
          }
        }
      }

      listDir(fullPath);
      return { path: dirPath, items: items.slice(0, 100) }; // Limit to 100 items
    } catch (error: any) {
      return { error: `Failed to list directory: ${error.message}` };
    }
  },
});

// Tool: Search in files
export const searchFilesTool = createTool({
  id: 'search_files',
  description: 'Search for a pattern in files. Returns matching lines with file paths.',
  inputSchema: z.object({
    pattern: z.string().describe('Text pattern to search for'),
    directory: z.string().default('src').describe('Directory to search in'),
  }),
  execute: async ({ context }) => {
    const { pattern, directory } = context as { pattern: string; directory: string };
    const searchDir = path.resolve(PROJECT_ROOT, directory);

    if (!searchDir.startsWith(PROJECT_ROOT)) {
      return { error: 'Access denied: path outside project root' };
    }

    const results: { file: string; line: number; content: string }[] = [];

    function searchInDir(dir: string) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            searchInDir(fullPath);
          } else if (entry.name.match(/\.(ts|tsx|js|jsx|json|md)$/)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                if (line.toLowerCase().includes(pattern.toLowerCase())) {
                  results.push({
                    file: path.relative(PROJECT_ROOT, fullPath),
                    line: idx + 1,
                    content: line.trim().slice(0, 200),
                  });
                }
              });
            } catch {
              // Skip files that can't be read
            }
          }
        }
      } catch {
        // Skip directories that can't be read
      }
    }

    searchInDir(searchDir);
    return { pattern, matches: results.slice(0, 50) }; // Limit results
  },
});

// Tool: Run shell command (limited)
export const runCommandTool = createTool({
  id: 'run_command',
  description: 'Run a safe shell command. Limited to: npm run lint, npm run test, npm run build, git status, git diff, ls',
  inputSchema: z.object({
    command: z.enum(['npm run lint', 'npm run test', 'npm run build', 'git status', 'git diff', 'ls'])
      .describe('The command to run'),
  }),
  execute: async ({ context }) => {
    const { command } = context as { command: string };

    try {
      const output = execSync(command, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
      return { command, output: output.slice(0, 5000) };
    } catch (error: any) {
      return {
        command,
        error: error.message,
        output: error.stdout?.slice(0, 2000) || '',
      };
    }
  },
});
