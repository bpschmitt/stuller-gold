#!/usr/bin/env node
/**
 * update-prices.js
 *
 * Fetches today's Stuller price-per-DWT for each ring SKU, applies the
 * markup multiplier, and writes output/quote-table.html (Squarespace-ready).
 *
 * Cost formula:  cost = dwt × pricePerDWT × markup
 *
 * Usage:  STULLER_USER=x STULLER_PASS=y node src/update-prices.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products, DEFAULT_MARKUP } from './products.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
const STULLER_USER = process.env.STULLER_USER;
const STULLER_PASS = process.env.STULLER_PASS;

if (!STULLER_USER || !STULLER_PASS) {
  console.error('ERROR: STULLER_USER and STULLER_PASS environment variables must be set.');
  console.error('Copy .env.example to .env, fill in your credentials, then run: source .env && npm run update');
  process.exit(1);
}

const STULLER_AUTH = 'Basic ' + Buffer.from(`${STULLER_USER}:${STULLER_PASS}`).toString('base64');

// ---------------------------------------------------------------------------
// Fetch a single SKU from Stuller
// Returns { pricePerDWT, metalMarkets }
// ---------------------------------------------------------------------------
async function fetchSKU(sku) {
  const url = `https://api.stuller.com/v2/products?SKU=${encodeURIComponent(sku)}`;
  const res = await fetch(url, {
    headers: { Authorization: STULLER_AUTH },
  });

  if (!res.ok) {
    throw new Error(`Stuller API error for SKU ${sku}: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const product = data.Products?.[0];

  if (!product) {
    throw new Error(`No product returned for SKU: ${sku}`);
  }

  return {
    pricePerDWT:  product.Price.Value,
    metalMarkets: data.MetalMarkets,
  };
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatUSD(amount) {
  return '$' + amount.toLocaleString('en-US');
}

function formatRange(cost, spread = 100) {
  const lo = Math.floor(cost / 25) * 25;
  const hi = lo + spread;
  return `${formatUSD(lo)} – ${formatUSD(hi)}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Fetching Stuller prices…');

  // Fetch all SKUs in parallel
  const results = await Promise.all(
    products.map((ring) => fetchSKU(ring.sku))
  );

  // Pull gold/silver spot from the first response (same for all)
  const metalMarkets = results[0].metalMarkets;
  const goldSpot   = metalMarkets.find((m) => m.Type === 'Gold')?.Rate ?? 0;
  const silverSpot = metalMarkets.find((m) => m.Type === 'Silver')?.Rate ?? 0;

  // Build table rows
  const tableRows = products.map((ring, i) => {
    const { pricePerDWT } = results[i];
    const markup = ring.markup ?? DEFAULT_MARKUP;
    const cost = ring.dwt !== null ? Math.round(ring.dwt * pricePerDWT * markup) : null;
    const issilver = ring.metal.toLowerCase().includes('silver');

    if (cost !== null) {
      console.log(`  ${ring.metal} ${ring.width} ${ring.profile}: $${pricePerDWT}/DWT × ${ring.dwt} DWT = $${cost}`);
    } else {
      console.log(`  ${ring.metal} ${ring.width} ${ring.profile}: DWT not set — skipping`);
    }

    const displayRange = cost !== null ? formatRange(cost, issilver ? 50 : 100) : '—';
    const sortVal      = cost !== null ? cost : -1;
    return `      <tr>
        <td>${ring.width}</td>
        <td class="metal-col">${ring.metal}</td>
        <td>${ring.profile}</td>
        <td class="price-col" data-sort="${sortVal}">${displayRange}</td>
      </tr>`;
  }).join('\n');

  const today = new Date();

  // Read template
  const templatePath = path.join(__dirname, 'template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Replace tokens
  html = html
    .replace('{{TABLE_ROWS}}', tableRows)
    .replace('{{UPDATE_DATE}}', formatDate(today))
    .replace('{{GOLD_PRICE_PER_OZ}}', formatUSD(Math.round(goldSpot)))
    .replace('{{SILVER_PRICE_PER_OZ}}', formatUSD(Math.round(silverSpot)));

  // Write output
  const outputDir = path.join(ROOT, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, 'quote-table.html'), html, 'utf8');
  console.log('\nWrote: output/quote-table.html');

  fs.writeFileSync(
    path.join(outputDir, 'last-updated.json'),
    JSON.stringify({ updatedAt: today.toISOString(), goldSpotUSD: goldSpot, silverSpotUSD: silverSpot }, null, 2) + '\n',
    'utf8'
  );
  console.log('Wrote: output/last-updated.json');
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
