import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    
    // Gzip compression
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    target: 'es2020',
    minify: 'terser',
    
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    },
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI components
          'ui-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          
          // Data/State management
          'data-vendor': ['@tanstack/react-query', 'axios'],
          
          // Maps (large library)
          'map-vendor': ['mapbox-gl', 'leaflet', 'react-leaflet'],
          
          // Charts
          'chart-vendor': ['recharts'],
          
          // AI/Chat
          'ai-vendor': ['@google/generative-ai', '@huggingface/inference'],
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline small assets
    
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  
  // Server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    
    // Proxy API requests in development
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
  },
  
  // Dependency pre-bundling
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
  },
})
