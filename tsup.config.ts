import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/lambda.ts', 'src/trpc.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  clean: true,
  format: ['esm', 'cjs'],
  target: 'node18',
  minify: false,
  // for now we include flat in the bundle because it is not exported correctly for both esm and cjs
  noExternal: [/flat/, /opentelemetry/],
})
