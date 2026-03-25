// Ring catalog with back-calculated metal weights.
//
// Gram weights were derived from Jan 5, 2025 example prices:
//   Gold spot: $4,373/oz = $140.60/gram raw gold
//   14k purity: 14/24 = 0.5833  → effective $81.99/gram
//   10k purity: 10/24 = 0.4167  → effective $58.64/gram
//   Silver spot ~$28/oz = $0.90/gram raw, sterling 92.5% → $0.833/gram
//
// formula: grams = jan5Price / (spotPrice/31.1035 * purity)

export const TROY_OZ_TO_GRAMS = 31.1035;

export const PURITY = {
  gold14k: 14 / 24,   // 0.5833
  gold10k: 10 / 24,   // 0.4167
  silver:  0.925,     // sterling silver
};

// Jan 5 reference prices used to back-calculate gram weights
export const JAN5_GOLD_SPOT  = 4373;  // USD/troy oz
export const JAN5_SILVER_SPOT =   28;  // USD/troy oz (approximate)

export const products = [
  {
    width:     '4 mm',
    metal:     '14k White Gold',
    profile:   'Rounded Outside / Flat Inside 1.5 mm',
    grams:     10.71,
    metalType: 'gold14k',
  },
  {
    width:     '4 mm',
    metal:     '14k White Gold',
    profile:   'Flat Outside / Flat Inside 1.5 mm',
    grams:     12.00,
    metalType: 'gold14k',
  },
  {
    width:     '4 mm',
    metal:     '14k White Gold',
    profile:   'Rounded Outside / Rounded Inside 2 mm',
    grams:     13.59,
    metalType: 'gold14k',
  },
  {
    width:     '4 mm',
    metal:     '14k White Gold',
    profile:   'Flat Outside / Flat Inside 2 mm',
    grams:     16.00,
    metalType: 'gold14k',
  },
  {
    width:     '2 mm',
    metal:     '14k White Gold',
    profile:   'Rounded Outside / Flat Inside 1.5 mm',
    grams:     5.35,
    metalType: 'gold14k',
  },
  {
    width:     '6 mm',
    metal:     '14k White Gold',
    profile:   'Rounded Outside / Flat Inside 1.5 mm',
    grams:     16.06,
    metalType: 'gold14k',
  },
  {
    width:     '4 mm',
    metal:     '10k White Gold',
    profile:   'Rounded Outside / Flat Inside 1.5 mm',
    grams:     9.72,
    metalType: 'gold10k',
  },
  {
    width:     '4 mm',
    metal:     'Sterling Silver',
    profile:   'Rounded Outside / Rounded Inside 2 mm',
    grams:     52.8,
    metalType: 'silver',
  },
];
