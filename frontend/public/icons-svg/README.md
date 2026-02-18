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
- **brands to process for svg icons** - Source list of brands
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

Use URL encoding when resolving icon paths so brands with `/` or spaces work reliably:

```ts
const getBrandIconUrl = (brand?: string): string | null => {
  if (!brand) return null;
  return `/icons-svg/${encodeURIComponent(brand)}.svg`;
};
```

## Notes

- These are clean, consistent **brand markers** (vector monograms), not trademark logo downloads.
- If you later want official logos, the recommended next layer is:
  - `simple-icons` where available
  - fallback to these generated markers for unsupported brands
