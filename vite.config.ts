import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'http://192.168.3.16:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // 修改请求头
            proxyReq.setHeader('Origin', 'http://192.168.3.16:8000');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            // 添加 CORS 头
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          });
        }
      }
    }
  },
  base: './',  // 使用相对路径，确保在扩展环境中也能正确加载资源
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,  // 禁用 sourcemap
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,  // 保留 console
        drop_debugger: true
      }
    },
    // 确保所有代码都打包到一个文件中
    cssCodeSplit: false,  // 禁用 CSS 代码分割
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // 禁用代码分割，确保所有代码都在一个文件中
        manualChunks: undefined,
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/main.js',
        // 简化配置，直接使用固定的文件名
        assetFileNames: 'assets/style.[ext]'
      }
    }
  }
})
