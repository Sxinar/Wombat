import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/Wombat/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        widget: resolve(new URL('widcom.html', import.meta.url).pathname),
        admin: resolve(new URL('admin.html', import.meta.url).pathname),
      },
    },
  },
});
