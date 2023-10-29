import {defineConfig} from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'index.ts',
      name: '@funkey/interpreter',
      formats: ['es'],
      fileName: 'interpreter'
    }
  },
})
