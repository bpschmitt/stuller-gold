# stuller-gold

Generates a daily-updated gold ring material cost table for embedding in a Squarespace website.

## How it works

1. A GitHub Actions cron job runs at **8:07am ET every day**
2. It fetches live gold and silver spot prices from [goldapi.io](https://www.goldapi.io)
3. Material costs are recalculated for each ring in the catalog
4. `output/quote-table.html` is committed back to the repo — ready to paste into Squarespace

## Pricing math

Ring gram weights were back-calculated from known Jan 5, 2025 prices (gold at $4,373/oz):

```text
grams = jan5Price / (spotPrice / 31.1035 * purity)
```

Each day's cost is then:

```text
materialCost = grams × (todaySpotPrice / 31.1035) × purity
```

Purity factors: **14k = 14/24 (0.583)**, **10k = 10/24 (0.417)**, **sterling silver = 0.925**

## Local setup

```bash
npm install
cp .env.example .env
# add your goldapi.io key to .env
source .env
npm run update
# open output/quote-table.html in a browser to verify
```

## GitHub Actions setup

Add your goldapi.io key as a repository secret:

> Settings → Secrets and variables → Actions → New repository secret
> Name: `GOLDAPI_KEY`

The workflow can also be triggered manually from the Actions tab.

## Squarespace embed

Paste the contents of `output/quote-table.html` into a Squarespace **Code Block**.

The table includes sortable columns and shows both an estimated price range and the exact calculated cost for each ring configuration (based on size 7).

## Catalog

The product catalog is defined in `src/products.js`. Each entry has:

| Field | Description |
| --- | --- |
| `width` | Ring width (e.g. `4 mm`) |
| `metal` | Metal description (e.g. `14k White Gold`) |
| `profile` | Profile style |
| `grams` | Back-calculated metal weight |
| `metalType` | `gold14k`, `gold10k`, or `silver` |
