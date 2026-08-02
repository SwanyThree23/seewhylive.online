import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

/**
 * Vite plugin that intercepts lodash deep imports (e.g. `lodash/get`) and
 * redirects them to named exports from the pre-bundled main `lodash` package.
 *
 * recharts imports ~30 lodash functions via `import get from 'lodash/get'`
 * (default import). When Vite serves these raw CJS files without pre-bundling,
 * they lack ESM default exports, causing:
 *   "does not provide an export named 'default'"
 *
 * This plugin creates a virtual module for each deep import that re-exports
 * the named export from the main lodash package (which IS pre-bundled).
 */
function lodashDeepImportFix() {
  return {
    name: 'lodash-deep-import-esm-fix',
    enforce: 'pre',
    resolveId(source) {
      // Match 'lodash/<funcname>' but NOT 'lodash-es/...' or 'lodash' alone
      if (source.startsWith('lodash/') && !source.startsWith('lodash-es/')) {
        const funcName = source.slice('lodash/'.length).replace(/\.js$/, '');
        if (funcName && /^[a-zA-Z]+$/.test(funcName)) {
          return `\0lodash-eshim:${funcName}`;
        }
      }
      return null;
    },
    load(id) {
      if (id.startsWith('\0lodash-eshim:')) {
        const funcName = id.slice('\0lodash-eshim:'.length);
        return `import { ${funcName} as _${funcName} } from 'lodash';\nexport default _${funcName};\n`;
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    dedupe: ['react', 'react-dom', 'react-is', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-is', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler',
      'lodash', 'lodash-es',
      'recharts',
    ],
  },
  plugins: [
    lodashDeepImportFix(),
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