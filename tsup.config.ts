import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: false,
  dts: true,
  clean: true,
  format: ['esm'],
  target: 'node18',
  noExternal: [/^@opentelemetry\//, /^@baselime\//],
  metafile: true,
  minify: true
})
