import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'privy': ['@privy-io/react-auth'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts']
        }
      },
      external: (id) => {
        // Mark Solana dependencies as external since they're optional peer deps
        if (id.includes('@solana-program/system') || id.includes('@solana')) {
          return false; // Don't externalize, but handle gracefully
        }
        return false;
      },
      onwarn(warning, warn) {
        // Suppress warnings about optional peer dependencies
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.id?.includes('@solana')) {
          return;
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: ['@privy-io/react-auth'],
    exclude: ['@solana-program/system']
  },
  resolve: {
    alias: {
      // Create a stub for the optional Solana dependency
      '@solana-program/system': 'data:text/javascript,export const getTransferSolInstruction = () => null;'
    }
  }
})
