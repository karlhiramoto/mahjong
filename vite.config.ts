import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL || '/mahjong/',
  server: {
    port: 3000,
    open: true
  }
});
