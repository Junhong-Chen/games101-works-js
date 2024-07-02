import { resolve } from "path"

/** @type {import('vite').UserConfig} */
export default {
  base: process.env.npm_package_name,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // 主页
        work0: resolve(__dirname, '0/index.html'),
        work1: resolve(__dirname, '1/index.html'),
        work2: resolve(__dirname, '2/index.html'),
        work3: resolve(__dirname, '3/index.html'),
        work4: resolve(__dirname, '4/index.html'),
        work5: resolve(__dirname, '5/index.html'),
        work6: resolve(__dirname, '6/index.html'),
        work7: resolve(__dirname, '7/index.html'),
        work8: resolve(__dirname, '8/index.html'),
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
}