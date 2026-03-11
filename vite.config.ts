import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const defaultOutDir = process.platform === 'win32' ? 'C:/temp/sazoo-dist' : 'dist';
const isVercelBuild = ['1', 'true', 'yes'].includes(String(process.env.VERCEL || '').toLowerCase());
const resolvedBasePath = process.env.VITE_BASE_PATH || (isVercelBuild ? '/' : './');

const chunkByModule = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  if (
    id.includes('KTX2Loader')
    || id.includes('ktx-parse')
  ) {
    return 'ktx2-vendor';
  }

  if (
    id.includes('@react-three/')
    || id.includes('three-stdlib')
    || id.includes('/three/')
    || id.includes('\\three\\')
    || id.includes('react-error-boundary')
  ) {
    return 'three-scene';
  }

  if (id.includes('framer-motion')) {
    return 'motion-vendor';
  }

  if (id.includes('firebase')) {
    return 'firebase-vendor';
  }

  if (id.includes('html2canvas')) {
    return 'capture-vendor';
  }

  if (id.includes('lucide-react')) {
    return 'icons-vendor';
  }

  return undefined;
};

export default defineConfig({
  base: resolvedBasePath,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    jsxDev: false,
  },
  server: {
    allowedHosts: true, // Allow Cloudflare tunnel and other external hosts
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: process.env.BUILD_OUT_DIR || defaultOutDir,
    // Ensure optimal minification
    minify: 'esbuild',
    // Disable sourcemaps in production to reduce build artifact size
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      // Aggressive tree-shaking settings
      treeshake: {
        preset: 'recommended',
      },
      output: {
        manualChunks(id) {
          return chunkByModule(id);
        },
      },
    },
  },
});
