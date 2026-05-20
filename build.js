'use strict';

/*
 * build.js
 * --------
 * This is a static Express site — there is nothing to compile.
 *
 * However, the deployment platform (Hostinger) has this project's
 * framework configured as "Next.js" and expects a `.next` output
 * directory to exist after `npm run build`.
 *
 * To satisfy that expectation, this script creates `.next/` and copies
 * the contents of `public/` into it. That way the deploy succeeds
 * whether the platform serves `.next/` as static output OR runs the
 * Express server via `npm start` (which serves `public/` directly).
 */

const fs   = require('fs');
const path = require('path');

const root      = __dirname;
const publicDir = path.join(root, 'public');
const outDir    = path.join(root, '.next');

// Ensure the output directory exists
fs.mkdirSync(outDir, { recursive: true });

// Copy the static site into .next/ (Node 16.7+ supports fs.cpSync)
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, outDir, { recursive: true });
  console.log('Build complete — copied public/ into .next/');
} else {
  console.warn('Warning: public/ not found; created empty .next/ directory');
}
