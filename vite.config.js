import { defineConfig } from 'vite';

export default defineConfig({
  base: '/PrincessAria/',
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/.tmp_*/**', '**/*.log', '**/reports/**', '**/docs/**', '**/public/cinematic/**'],
    },
  },
});
