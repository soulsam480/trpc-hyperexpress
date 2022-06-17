import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  dts: true,
  tsconfig: 'tsconfig.build.json',
  format: ['cjs', 'esm'],
  clean: true,
  name: 'trpc-hyperexpress',
  external: ['@trpc/server', 'hyper-express'],
});
