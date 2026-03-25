# stuller-gold

Generates a daily-updated gold ring material cost table for embedding in a Squarespace website.

## How it works

1. A GitHub Actions cron job runs at **8:07am ET every day**
2. It fetches live pricing from the **Stuller Product API** for each ring SKU
3. Material costs are recalculated using the Stuller price-per-DWT × ring DWT weight × markup
4. `output/quote-table.html` is committed back to the repo — ready to paste into Squarespace

## Pricing math

```text
cost = pricePerDWT × dwt × markup
```

- **`pricePerDWT`** — fetched live from the Stuller API for each SKU
- **`dwt`** — pennyweight of sizing stock needed for a size 7 ring (stored in `src/products.js`)
- **`markup`** — `2.2` for gold, `3.0` for sterling silver (per-product, set in `src/products.js`)

Gold and silver spot prices displayed in the table footer also come from the Stuller API (`MetalMarkets` field).

## Local setup

```bash
npm install
cp .env.example .env
# add your Stuller credentials to .env
source .env
npm run update
# open output/quote-table.html in a browser to verify
```

## GitHub Actions setup

Add your Stuller credentials as repository secrets:

> Settings → Secrets and variables → Actions → New repository secret

| Secret | Value |
| --- | --- |
| `STULLER_USER` | Your Stuller username |
| `STULLER_PASS` | Your Stuller password |

The workflow can also be triggered manually from the Actions tab.

## Squarespace embed

Paste the contents of `output/quote-table.html` into a Squarespace **Code Block**.

The table includes sortable columns and shows an estimated price range for each ring configuration (based on size 7).

## Catalog

The product catalog is defined in `src/products.js`. Each entry has:

| Field | Description |
| --- | --- |
| `width` | Ring width (e.g. `4 mm`) |
| `metal` | Metal description (e.g. `14k White Gold`) |
| `profile` | Profile style |
| `dwt` | Pennyweight of sizing stock needed for a size 7 ring |
| `sku` | Stuller product SKU |
| `markup` | Price multiplier (optional — defaults to `2.2`) |
