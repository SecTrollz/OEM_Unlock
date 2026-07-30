#!/usr/bin/env node
// Regenerates the root-level pastable scripts (oem_unlock.js, etc.) from
// src/core + src/adapters. These scripts have no module system available
// where they're actually used (Burp/MITMproxy/Proxy Pin script boxes), so
// the output has to be a single self-contained file — this inlines the
// core modules a given adapter depends on, in dependency order, and
// strips every `require(...)`/`module.exports` along the way.
//
// Edit src/core or src/adapters, then run `npm run build`. Do not hand-
// edit the generated root files — they get overwritten.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CORE_DIR = path.join(ROOT, 'src', 'core');
const ADAPTERS_DIR = path.join(ROOT, 'src', 'adapters');

const ADAPTER_MAP = {
  'generic-proxy.template.js': 'oem_unlock.js',
  'proxypin-extension.template.js': 'oem_unlock_proxy_pin.js',
  'proxypin-android.template.js': 'proxypin-oem-unlock.js',
  'broad-fallback.template.js': 'nuclear_unlock.js',
  'anti-relock.template.js': 'anti-relock.js',
  'pre-unlock.template.js': 'pre_unlock.js',
};

const BANNER =
  '// AUTO-GENERATED from src/core + src/adapters — do not hand-edit.\n' +
  "// Edit the source and run 'npm run build' to regenerate this file.\n";

function stripRequiresAndStrict(source) {
  return source
    .replace(/const\s*\{[\s\S]*?\}\s*=\s*require\([^)]*\);\s*\n?/g, '')
    .replace(/const\s+\w+\s*=\s*require\([^)]*\);\s*\n?/g, '')
    .replace(/^'use strict';\s*\n?/m, '')
    .trim();
}

function directCoreDeps(source, requirePrefix) {
  const re = new RegExp(`require\\(['"]${requirePrefix}(\\w+)['"]\\)`, 'g');
  const deps = new Set();
  let m;
  while ((m = re.exec(source))) deps.add(m[1]);
  return [...deps];
}

// Returns the inlined, dependency-ordered source for a core module and
// everything it transitively requires, each module emitted exactly once.
function coreBody(name, visited) {
  if (visited.has(name)) return '';
  visited.add(name);

  const source = fs.readFileSync(path.join(CORE_DIR, `${name}.js`), 'utf8');
  const deps = directCoreDeps(source, '\\./');
  const depBodies = deps.map((d) => coreBody(d, visited)).filter(Boolean);

  // Core files always end with a top-level `module.exports = {...}` block —
  // cut there, we only want the function/const declarations above it.
  const lines = source.split('\n');
  const ownLines = [];
  for (const line of lines) {
    if (/^module\.exports\s*=/.test(line)) break;
    ownLines.push(line);
  }
  const ownBody = stripRequiresAndStrict(ownLines.join('\n'));

  return [...depBodies, ownBody].filter(Boolean).join('\n\n');
}

function buildAdapter(templateFile, outFile) {
  const templatePath = path.join(ADAPTERS_DIR, templateFile);
  const source = fs.readFileSync(templatePath, 'utf8');

  const deps = directCoreDeps(source, '\\.\\./core/');
  const visited = new Set();
  const coreBodies = deps.map((d) => coreBody(d, visited)).filter(Boolean).join('\n\n');

  const templateBody = stripRequiresAndStrict(source);

  const output = [BANNER, "'use strict';", '', coreBodies, '', templateBody, ''].join('\n');
  fs.writeFileSync(path.join(ROOT, outFile), output);
  console.log('Built', outFile);
}

for (const [template, outFile] of Object.entries(ADAPTER_MAP)) {
  buildAdapter(template, outFile);
}
