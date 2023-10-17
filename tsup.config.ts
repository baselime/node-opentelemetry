import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/trpc.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  clean: true,
  format: ['esm', 'cjs'],
  target: 'node18',
  noExternal: [/^@opentelemetry\//, /^@baselime\//, /^@trpc\/server/, /^flat/],
  minify: true,
})
