import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Set base to './' so that the app works correctly when deployed to a 
  // GitHub Pages subpath (e.g. username.github.io/repo-name/)
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
  }
});