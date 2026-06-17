import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: ['simone.snake-pythagorean.ts.net'],
  },
});
