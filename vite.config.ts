import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { builtinModules } from 'module';

// Node.js built-in modules to externalize
const nodeBuiltins = builtinModules.map(m => [m, `node:${m}`]).flat();

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        manager: resolve(__dirname, 'src/manager.tsx'),
        preset: resolve(__dirname, 'src/preset.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        // React
        'react',
        'react-dom',
        'react/jsx-runtime',
        // Storybook
        '@storybook/manager-api',
        '@storybook/components',
        '@storybook/theming',
        '@storybook/types',
        // Node.js deps for server
        'ws',
        '@anthropic-ai/sdk',
        // Node.js built-ins
        ...nodeBuiltins,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    sourcemap: true,
    minify: false,
    target: 'node18',
  },
});
