#!/usr/bin/env node
/**
 * sync-products-from-json.mjs
 *
 * Reads Healios Project Assets/Products/products.json (Monique's authoritative
 * product spec) and generates an idempotent SQL file that updates live D1 to
 * match. Run output against remote D1 with:
 *
 *   wrangler d1 execute healios-db --remote --file scripts/out/sync-products.sql
 *
 * The script NEVER runs wrangler itself. User reviews the generated SQL first.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const JSON_PATH = resolve(REPO_ROOT, 'docs/healios-products-spec.json');
const OUT_PATH = resolve(REPO_ROOT, 'scripts/out/sync-products.sql');

const COMING_SOON_IDS = [
  'lions-mane-gummies',
  'hair-skin-nails-gummies',
  'iron-vitamin-c-gummies',
  'kids-multivitamin-gummies',
  'folic-acid-gummies',
  'turmeric-ginger-gummies',
  'halo-glow-collagen',
  'sleep-support-gummies',
  'night-magnesium-gummies',
];

// SQL string literal escaping: single-quote in SQLite is doubled.
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Ingredients: products.json gives a single string. D1 wants JSON array.
// If the string contains semicolons (Probiotic product), split on those.
// Otherwise split on ", " but preserve parenthesised groups that contain commas.
function splitIngredients(raw) {
  if (!raw) return [];
  const sep = raw.includes(';') ? ';' : ',';
  const out = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    // Split at the separator char at depth 0.
    // For comma mode, require trailing space (avoids "500mg," in mid-dosage).
    const atSep = ch === sep && depth === 0 && (sep === ';' || raw[i + 1] === ' ');
    if (atSep) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      if (sep === ',') i++; // skip the space that follows a comma
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// Rewrite marketing-copy "gummy/gummies" language for products that are actually
// capsules. products.json ships stale short descriptions inherited from when
// these were gummy products. Flagged for Monique review in session notes.
// NOTE: keeping casing-sensitive "gummy" -> "capsule" direct swap for human-review clarity.
function rewriteCapsuleDescription(slug, short) {
  if (!short) return short;
  const capsuleProducts = new Set([
    'probiotics-vitamins-gummies',
    'ashwagandha-gummies',
    'magnesium-gummies',
  ]);
  if (!capsuleProducts.has(slug)) return short;
  return short
    .replace(/delicious gummy form/gi, 'easy-to-swallow capsules')
    .replace(/tasty magnesium gummies/gi, 'premium magnesium capsules')
    .replace(/\bgummies\b/gi, 'capsules')
    .replace(/\bgummy\b/gi, 'capsule');
}

function productUpdate(p) {
  // Ingredients: prepend the 'active' line as the first array element so the PDP
  // surfaces the regulated dosage claim before food-label fillers. UK supplement
  // labelling convention puts the active ingredient/NRV line first.
  //
  // products.json sometimes repeats the active in the 'full' list (e.g. KSM-66
  // Ashwagandha appears both as the active with dosage and as a food-label item
  // without dosage). Dedupe: skip any 'full' entry that starts with a prefix of
  // the active line (case-insensitive, 20-char prefix).
  const activeLine = p.ingredients?.active?.trim();
  const fullSplit = p.ingredients?.full ? splitIngredients(p.ingredients.full) : [];
  const dedupeKey = activeLine ? activeLine.toLowerCase().slice(0, 20) : null;
  const dedupedFull = dedupeKey
    ? fullSplit.filter((x) => !x.toLowerCase().startsWith(dedupeKey))
    : fullSplit;
  const ingredients = [];
  if (activeLine) ingredients.push(activeLine);
  ingredients.push(...dedupedFull);

  const allergens = p.allergens ? [p.allergens] : null; // wrap string in single-element array
  const cautions = p.contraindications || null;
  const isVegan = p.suitability?.vegan === true ? 1 : 0; // false OR unknown both map to 0 (safer)
  const description = rewriteCapsuleDescription(p.slug, p.description?.short);

  const cols = [];
  if (description) cols.push(`description = ${q(description)}`);
  if (ingredients.length) cols.push(`ingredients = ${q(JSON.stringify(ingredients))}`);
  if (allergens !== null) cols.push(`contains_allergens = ${q(JSON.stringify(allergens))}`);
  if (cautions !== null) cols.push(`product_cautions = ${q(cautions)}`);
  cols.push(`is_vegan = ${isVegan}`);
  cols.push(`updated_at = unixepoch()`);

  return `-- ${p.slug} (${p.name})\n` +
    `UPDATE products SET\n  ${cols.join(',\n  ')}\nWHERE id = ${q(p.slug)};`;
}

function comingSoonUpdate(ids) {
  const list = ids.map(q).join(', ');
  return `-- Draft 9 products to Coming Soon\n` +
    `UPDATE products SET is_coming_soon = 1, updated_at = unixepoch()\n` +
    `WHERE id IN (${list});`;
}

function unpublishSleepSupport() {
  return `-- Remove Sleep Support Gummies from site (ticket #1)\n` +
    `UPDATE products SET is_published = 0, updated_at = unixepoch()\n` +
    `WHERE id = 'sleep-support-gummies';`;
}

function main() {
  const json = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  const live = json.products.filter((p) => p.status === 'live');

  const header = [
    `-- Generated by scripts/sync-products-from-json.mjs`,
    `-- Source: Healios Project Assets/Products/products.json (${json.schema_version}, ${json.generated_at})`,
    `-- Generated at: ${new Date().toISOString()}`,
    `-- Idempotent: safe to run multiple times.`,
    `--`,
    `-- Changes:`,
    `--   - Sync ${live.length} live products to products.json values`,
    `--   - Draft ${COMING_SOON_IDS.length} products to Coming Soon`,
    `--   - Unpublish Sleep Support Gummies`,
    `--`,
    `-- NOTE: no BEGIN/COMMIT wrapping; Cloudflare D1 rejects explicit transactions`,
    `-- when executed via 'wrangler d1 execute --file'. Each statement commits`,
    `-- independently. If a statement fails mid-file, prior statements stay applied.`,
    `-- The script is idempotent so you can re-run to retry failed statements.`,
    ``,
  ].join('\n');

  const blocks = [];
  blocks.push(unpublishSleepSupport());
  blocks.push(comingSoonUpdate(COMING_SOON_IDS));
  for (const p of live) blocks.push(productUpdate(p));

  const sql = header + blocks.join('\n\n') + '\n';

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, sql, 'utf-8');

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  ${live.length} live products synced`);
  console.log(`  ${COMING_SOON_IDS.length} products drafted to Coming Soon`);
  console.log(`  1 product unpublished (sleep-support-gummies)`);
  console.log();
  console.log('Review the SQL, then run:');
  console.log(`  cd worker-api && npx wrangler d1 execute healios-db --remote --file ../scripts/out/sync-products.sql`);
}

main();
