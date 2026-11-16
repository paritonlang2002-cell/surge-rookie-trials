import { defineConfig } from 'vite';

// Change this to your GitHub repository name, including both slashes.
export default defineConfig({
  base: '/surge-rookie-trials/',
  build: { assetsDir: 'assets', sourcemap: false }
});