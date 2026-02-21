# Brand Logos (`icons-brand`)

This folder stores **official brand logo SVGs** downloaded from:

- `https://www.brandsoftheworld.com/`

Runtime usage in the app:

1. Try `/icons-brand/<encoded-brand>.svg` (preferred)
2. Fall back to `/icons-svg/<encoded-brand>.svg` (generated marker)
3. Fall back to `⛽` marker if both fail

## Source of truth for brands

Use the shared brand list:

- `../icon-brands.txt`

## Scripts

- `download_brand_logo.py`: download one brand logo SVG
- `fetch_brand_logos.py`: batch fetch all brands with resume logging
- `to_32x32_svg.py`: converts downloaded image assets to 32x32 SVG output

## Usage

Fetch one brand:

```bash
python3 download_brand_logo.py "Shell"
```

Batch fetch all brands from the shared list:

```bash
python3 fetch_brand_logos.py
```

Useful options:

```bash
python3 fetch_brand_logos.py --limit 10
python3 fetch_brand_logos.py --force
python3 fetch_brand_logos.py --brands-file ../icon-brands.txt
```

Outputs:

- one 32x32 SVG logo file per brand in this folder (`<encodeURIComponent(brand)>.svg`)
- original downloaded source file per brand in `./_originals/` (same encoded brand filename, source extension)
- `manifest.json` mapping brand name to filename
- `process_log.json` with processed/failed status

Manual override behavior:

- Before any network download, the pipeline checks `./_originals/<encodeURIComponent(brand)>.*`.
- If a file exists, it is used as the source for 32x32 SVG generation.

## Notes

- Respect logo trademark and licensing requirements for production use.
- Some brands may not have SVG downloads available on Brands of the World.
- When unavailable, keep using `icons-svg` generated fallback markers.
