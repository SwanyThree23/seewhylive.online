import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    dedupe: ['react', 'react-dom', 'react-is', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-is': path.resolve(__dirname, 'node_modules/react-is'),
      'scheduler': path.resolve(__dirname, 'node_modules/scheduler'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-is', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler', 'recharts'],
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: false,
      navigationNotifier: false,
      visualEditAgent: false
    }),
    react(),
  ]
});