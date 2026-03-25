#!/usr/bin/env node
/**
 * update-prices.js
 *
 * Fetches today's gold & silver spot prices from goldapi.io,
 * recalculates material costs for each ring in the catalog,
 * and writes output/quote-table.html (Squarespace-ready).
 *
 * Usage:
 *   GOLDAPI_KEY=your_key node src/update-prices.js
 *
 * Requires:
 *   npm install   (installs node-fetch)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products, PURITY, TROY_OZ_TO_GRAMS } from './products.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
const GOLDAPI_KEY = process.env.GOLDAPI_KEY;
if (!GOLDAPI_KEY) {
  console.error('ERROR: GOLDAPI_KEY environment variable is not set.');
  console.error('Copy .env.example to .env and add your key, then run: node src/update-prices.js');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch spot price from goldapi.io
// symbol: 'XAU' (gold) or 'XAG' (silver)
// Returns price in USD per troy oz
// ---------------------------------------------------------------------------
async function fetchSpotPrice(symbol) {
  const url = `https://www.goldapi.io/api/${symbol}/USD`;
  const res = await fetch(url, {
    headers: {
      'x-access-token': GOLDAPI_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`goldapi.io error for ${symbol}: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // goldapi.io returns { price: number, ... }
  if (typeof data.price !== 'number') {
    throw new Error(`Unexpected response from goldapi.io for ${symbol}: ${JSON.stringify(data)}`);
  }

  return data.price;
}

// ---------------------------------------------------------------------------
// Calculate material cost for a single ring
// ---------------------------------------------------------------------------
function calcMaterialCost(ring, goldSpot, silverSpot) {
  const purity = PURITY[ring.metalType];
  let spotPerOz;

  if (ring.metalType === 'silver') {
    spotPerOz = silverSpot;
  } else {
    spotPerOz = goldSpot;
  }

  const pricePerGram = (spotPerOz / TROY_OZ_TO_GRAMS) * purity;
  return Math.round(ring.grams * pricePerGram);
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
// Build HTML table rows
// ---------------------------------------------------------------------------
function buildTableRows(goldSpot, silverSpot) {
  return products
    .map((ring) => {
      const cost = calcMaterialCost(ring, goldSpot, silverSpot);
      return `      <tr>
        <td>${ring.width}</td>
        <td class="metal-col">${ring.metal}</td>
        <td>${ring.profile}</td>
        <td class="price-col" data-sort="${cost}">${formatRange(cost, ring.metalType === 'silver' ? 50 : 100)}</td>
        <td class="price-col" data-sort="${cost}">${formatUSD(cost)}</td>
      </tr>`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Fetching spot prices from goldapi.io…');

  const [goldSpot, silverSpot] = await Promise.all([
    fetchSpotPrice('XAU'),
    fetchSpotPrice('XAG'),
  ]);

  console.log(`  Gold:   $${goldSpot.toFixed(2)}/oz`);
  console.log(`  Silver: $${silverSpot.toFixed(2)}/oz`);

  const today = new Date();
  const tableRows = buildTableRows(goldSpot, silverSpot);

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

  const outputPath = path.join(outputDir, 'quote-table.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`\nWrote: output/quote-table.html`);

  // Write metadata sidecar
  const meta = {
    updatedAt: today.toISOString(),
    goldSpotUSD: goldSpot,
    silverSpotUSD: silverSpot,
  };
  fs.writeFileSync(
    path.join(outputDir, 'last-updated.json'),
    JSON.stringify(meta, null, 2) + '\n',
    'utf8'
  );
  console.log('Wrote: output/last-updated.json');
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
