#!/usr/bin/env node
/**
 * build-emails.mjs — generate worker-api/src/emails/generated.ts.
 *
 * Enumerates every React Email template under src/lib/emails/emails/<group>/
 * and writes a single file that imports each template and re-exports a
 * render<Pascal>(props) async function. The Worker calls those renderers at
 * send time — wrangler's bundler (esbuild) handles TSX compilation and bundles
 * @react-email/render into the Worker.
 *
 * This script does no runtime compilation itself — it's pure static codegen.
 * Safe to run repeatedly; output is deterministic given the same template set.
 *
 * Run: node scripts/build-emails.mjs
 * Called automatically by package.json `predeploy` / `prebuild` hooks.
 */

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, '..');
const EMAILS_DIR = resolve(REPO, 'src/lib/emails/emails');
const OUT = resolve(REPO, 'worker-api/src/emails/generated.ts');

// "01-order-confirmation" -> "OrderConfirmation"
function toPascal(name) {
  return name
    .replace(/^\d+-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function findTemplates() {
  const groups = readdirSync(EMAILS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const list = [];
  for (const group of groups) {
    const files = readdirSync(resolve(EMAILS_DIR, group))
      .filter((f) => f.endsWith('.tsx'))
      .sort();
    for (const f of files) {
      const id = basename(f, '.tsx');
      const pascal = toPascal(id);
      list.push({ id, pascal, group });
    }
  }
  return list;
}

function main() {
  const templates = findTemplates();
  console.log(`[build-emails] found ${templates.length} templates`);

  const lines = [];
  lines.push(`// AUTO-GENERATED — do not edit by hand. Regenerate via:`);
  lines.push(`//   node scripts/build-emails.mjs`);
  lines.push(`//`);
  lines.push(`// Each renderX(props) returns a full HTML document string suitable for`);
  lines.push(`// Resend's \`html\` field. The file imports EVERY template; esbuild's`);
  lines.push(`// tree-shaker drops unused renderers from the final Worker bundle.`);
  lines.push(``);
  lines.push(`import { render } from '@react-email/render';`);
  lines.push(`import React from 'react';`);
  lines.push(``);

  for (const t of templates) {
    lines.push(
      `import ${t.pascal} from '../../../src/lib/emails/emails/${t.group}/${t.id}';`,
    );
  }
  lines.push('');

  for (const t of templates) {
    lines.push(`/** Render ${t.group}/${t.id} as a full HTML document. */`);
    lines.push(
      `export async function render${t.pascal}(props: Parameters<typeof ${t.pascal}>[0] = {} as any): Promise<string> {`,
    );
    lines.push(`  return await render(React.createElement(${t.pascal}, props as any));`);
    lines.push(`}`);
    lines.push('');
  }

  // Manifest — plain metadata, no component references. Client-side admin
  // preview reads this list; Worker doesn't touch it.
  lines.push(`export const EMAIL_TEMPLATES = [`);
  for (const t of templates) {
    lines.push(`  { id: '${t.id}', group: '${t.group}' as const, component: '${t.pascal}' },`);
  }
  lines.push(`] as const;`);
  lines.push('');
  lines.push(`export type EmailTemplateId = typeof EMAIL_TEMPLATES[number]['id'];`);
  lines.push('');

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, lines.join('\n'), 'utf-8');
  console.log(`[build-emails] wrote ${OUT} (${templates.length} renderers)`);
}

main();
