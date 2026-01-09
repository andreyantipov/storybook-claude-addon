import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export interface ClaudeTerminalRef {
  write: (text: string) => void;
  writeln: (text: string) => void;
  clear: () => void;
  focus: () => void;
  scrollToBottom: () => void;
}

export interface ClaudeTerminalProps {
  onInput?: (data: string) => void;
  theme?: 'dark' | 'light';
  fontSize?: number;
  fontFamily?: string;
}

const THEMES = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
    cursorAccent: '#1e1e1e',
    selectionBackground: 'rgba(255, 255, 255, 0.3)',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
  },
  light: {
    background: '#ffffff',
    foreground: '#383a42',
    cursor: '#383a42',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(0, 0, 0, 0.2)',
    black: '#383a42',
    red: '#e45649',
    green: '#50a14f',
    yellow: '#c18401',
    blue: '#4078f2',
    magenta: '#a626a4',
    cyan: '#0184bc',
    white: '#fafafa',
    brightBlack: '#4f525e',
    brightRed: '#e06c75',
    brightGreen: '#98c379',
    brightYellow: '#e5c07b',
    brightBlue: '#61afef',
    brightMagenta: '#c678dd',
    brightCyan: '#56b6c2',
    brightWhite: '#ffffff',
  },
};

export const ClaudeTerminal = forwardRef<ClaudeTerminalRef, ClaudeTerminalProps>(
  ({ onInput, theme = 'dark', fontSize = 14, fontFamily = 'Menlo, Monaco, "Courier New", monospace' }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const inputBufferRef = useRef<string>('');

    useImperativeHandle(ref, () => ({
      write: (text: string) => {
        xtermRef.current?.write(text);
      },
      writeln: (text: string) => {
        xtermRef.current?.writeln(text);
      },
      clear: () => {
        xtermRef.current?.clear();
        xtermRef.current?.write('\x1b[2J\x1b[H');
      },
      focus: () => {
        xtermRef.current?.focus();
      },
      scrollToBottom: () => {
        xtermRef.current?.scrollToBottom();
      },
    }));

    useEffect(() => {
      if (!terminalRef.current) return;

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize,
        fontFamily,
        theme: THEMES[theme],
        scrollback: 10000,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      terminal.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle user input
      terminal.onData((data) => {
        if (data === '\r') {
          // Enter key
          terminal.write('\r\n');
          if (inputBufferRef.current.trim() && onInput) {
            onInput(inputBufferRef.current);
          }
          inputBufferRef.current = '';
        } else if (data === '\x7f') {
          // Backspace
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            terminal.write('\b \b');
          }
        } else if (data === '\x03') {
          // Ctrl+C
          terminal.write('^C\r\n');
          inputBufferRef.current = '';
        } else if (data >= ' ' || data === '\t') {
          // Printable characters
          inputBufferRef.current += data;
          terminal.write(data);
        }
      });

      // Welcome message
      terminal.writeln('\x1b[1;36m╔════════════════════════════════════════════╗\x1b[0m');
      terminal.writeln('\x1b[1;36m║\x1b[0m  \x1b[1;33mClaude AI Assistant\x1b[0m                      \x1b[1;36m║\x1b[0m');
      terminal.writeln('\x1b[1;36m║\x1b[0m  Type your message and press Enter         \x1b[1;36m║\x1b[0m');
      terminal.writeln('\x1b[1;36m╚════════════════════════════════════════════╝\x1b[0m');
      terminal.writeln('');
      terminal.write('\x1b[1;32m>\x1b[0m ');

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(terminalRef.current);

      return () => {
        resizeObserver.disconnect();
        terminal.dispose();
      };
    }, [theme, fontSize, fontFamily, onInput]);

    // Update theme when it changes
    useEffect(() => {
      if (xtermRef.current) {
        xtermRef.current.options.theme = THEMES[theme];
      }
    }, [theme]);

    return (
      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px',
          padding: '8px',
          boxSizing: 'border-box',
          backgroundColor: THEMES[theme].background,
        }}
      />
    );
  }
);

ClaudeTerminal.displayName = 'ClaudeTerminal';
