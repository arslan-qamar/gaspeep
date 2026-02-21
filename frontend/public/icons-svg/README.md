# Brand Icon System

This directory now uses **generated vector icons** instead of PNG-to-pixel-SVG conversion.

## Why this is better

- Crisp at any zoom level (pure vectors, no pixelation)
- Tiny files (~1-2 KB each instead of ~60 KB)
- Deterministic output for every brand in the list
- No scraping, no brittle third-party HTML parsing
- Works for brand names with special characters (`AM/PM`, `On The Run (OTR)`, etc.)

## Files

- **generate_quality_icons.py** - Generates high-quality SVG icons for every brand
- **../icon-brands.txt** - Shared source list of brands
- **README.md** - This documentation

## Usage

Generate/re-generate all icons:

```bash
python3 generate_quality_icons.py
```

The script outputs:

- One SVG per brand in this folder
- Filenames URL-safe via `encodeURIComponent(brand)`
- `manifest.json` mapping brand name to filename

## Runtime integration

Use official brand icons as the first choice, and fall back to generated vectors when needed:

```ts
const getBrandIconUrls = (brand?: string): string[] => {
  if (!brand) return [];
  const encodedBrand = encodeURIComponent(brand);
  return [
    `/icons-brand/${encodedBrand}.svg`, // preferred official brand icon
    `/icons-svg/${encodedBrand}.svg`,   // generated vector fallback
  ];
};
```

If both paths fail, render a neutral fallback marker (for example `⛽`).

## Notes

- These are clean, consistent **brand markers** (vector monograms), not trademark logo downloads.
- Official logos now live in `../icons-brand` and are fetched with its dedicated scripts.
- Keep this folder as deterministic fallback markers for unsupported or missing brand logos.
