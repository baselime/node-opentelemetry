import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  format: ['cjs', 'esm'],
  target: 'es2022',
  minify: false,
  metafile: true,
  // for now we include flat in the bundle because it is not exported correctly for both esm and cjs
  noExternal: [/flat/, /opentelemetry/],
})
