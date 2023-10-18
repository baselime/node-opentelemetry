import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  clean: true,
  format: ['esm', 'cjs'],
  target: 'node18',
  noExternal: [/^@opentelemetry\//, /^@trpc\/server/, /^flat/],
  minify: false,
})
