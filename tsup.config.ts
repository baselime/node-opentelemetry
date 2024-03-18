import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/lambda.ts', 'src/trpc.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  clean: true,
  format: ['cjs'],
  target: 'node18',
  minify: false,
  metafile: true,
  // for now we include flat in the bundle because it is not exported correctly for both esm and cjs
  noExternal: [/flat/, /opentelemetry/],
})
