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
    include: [
      'react', 'react-dom', 'react-is', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler',
      'lodash', 'lodash-es',
      // Deep lodash paths imported by recharts (excluded below) — pre-bundle for CJS→ESM interop
      'lodash/get', 'lodash/merge', 'lodash/throttle', 'lodash/debounce', 'lodash/uniq',
      'lodash/isEmpty', 'lodash/isFunction', 'lodash/omit', 'lodash/pick', 'lodash/cloneDeep',
      'lodash/some', 'lodash/every', 'lodash/find', 'lodash/findIndex', 'lodash/map',
      'lodash/filter', 'lodash/reduce', 'lodash/flatten', 'lodash/keys', 'lodash/values',
      'lodash/assign', 'lodash/has', 'lodash/isArray', 'lodash/isObject', 'lodash/isString',
      'lodash/isNumber', 'lodash/isNil', 'lodash/max', 'lodash/min', 'lodash/range',
      'lodash/once', 'lodash/noop', 'lodash/identity', 'lodash/stubFalse', 'lodash/stubTrue',
      'lodash/first', 'lodash/flatMap', 'lodash/isBoolean', 'lodash/isEqual', 'lodash/isNaN',
      'lodash/isPlainObject', 'lodash/last', 'lodash/mapValues', 'lodash/maxBy', 'lodash/memoize',
      'lodash/minBy', 'lodash/sortBy', 'lodash/sumBy', 'lodash/uniqBy', 'lodash/upperFirst',
      'lodash/findLast', 'lodash/clone', 'lodash/without', 'lodash/chunk', 'lodash/compact',
    ],
    // recharts no longer excluded — React dedupe + aliases above prevent the
    // duplicate-React "Should have a queue" error while letting Vite pre-bundle
    // recharts's lodash deep imports (fixes "does not provide an export named 'default'").
    esbuildOptions: {
      // Ensure pre-bundled deps resolve React from the app's single copy
      resolveExtensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
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