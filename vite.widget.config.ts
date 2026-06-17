import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    outDir: 'static',
    emptyOutDir: false,
    lib: {
      entry: 'src/lib/widget/entry.ts',
      name: 'WombatWidget',
      fileName: () => 'widget.js',
      formats: ['iife']
    }
  },
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        customElement: true
      }
    })
  ]
});
