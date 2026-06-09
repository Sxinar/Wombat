import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
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
  };
});
