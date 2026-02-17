# Brand Logo Processing System

Automated system to download brand logos from Brands of the World and convert them to 32x32 SVG format.

## Files

- **process_brands.py** - Main orchestration script (resumable, tracks progress)
- **download_logo.py** - Logo download script with tiered strategy
- **to_32x32_svg.py** - Converts images to 32x32 pixel-art SVG (existing)
- **brand_domains.json** - Domain mapping for favicon fallback
- **brands to process for svg icons** - List of brands (one per line)
- **process_log.json** - Progress tracking (auto-generated)

## Usage

### Process all brands:
```bash
python3 process_brands.py
```

Features:
- **Resumable**: Can Ctrl+C and re-run to continue from where it stopped
- **Tracks progress**: Saved to `process_log.json`
- **Handles failures**: Logs errors and continues with next brand
- **Skips existing**: Won't re-download if `.svg` already exists

### Download single logo:
```bash
python3 download_logo.py "Brand Name"
```

Returns path to downloaded PNG on success, exits with code 1 on failure.

### Convert image to SVG:
```bash
python3 to_32x32_svg.py input.png output.svg
```

## Download Strategy (Tiered)

1. **Brands of the World** (70-80%): `https://www.brandsoftheworld.com/search/logo?search_api_views_fulltext={brand}`
   - High-quality logos
   - Covers most major brands
   - Respectful rate limiting (3-5s between requests)

2. **Google Favicon Service** (15-20%): `https://www.google.com/s2/favicons?domain={domain}&sz=256`
   - Works for brands with official websites
   - Lower quality but reliable
   - Uses domain mapping from `brand_domains.json`

3. **DuckDuckGo Images** (<5%): Browser automation fallback
   - For obscure regional brands
   - Limited use due to rate limiting

4. **Manual Override**: Place PNG files in `/tmp/gaspeep_logos/`
   - Script picks them up automatically on next run
   - Useful for brands that aren't downloadable

## Progress Tracking

The `process_log.json` file tracks:
- **processed**: Brands that were downloaded and converted
- **skipped**: Brands where SVG already exists
- **failed**: Brands that failed with error message
- **last_updated**: Last run timestamp

Format:
```json
{
  "processed": ["Shell", "BP"],
  "skipped": ["7-Eleven"],
  "failed": {
    "Some Brand": "Download timeout"
  },
  "last_updated": "2026-02-18T06:15:00Z"
}
```

## Troubleshooting

### Downloads are too slow
- The script adds respectful delays between requests (1-3s)
- This is intentional to avoid rate limiting
- Process takes ~2-3 minutes for all 47 brands

### Some brands failed
- Check `process_log.json` for error messages
- Try manually downloading from https://www.brandsoftheworld.com/
- Place PNG in `/tmp/gaspeep_logos/{brand}.png` and re-run

### Process got interrupted
- Just run `python3 process_brands.py` again
- It will resume from where it stopped (only missing brands are processed)

## Results

SVG files are saved to this directory with filenames like:
- `7-Eleven.svg`
- `Shell.svg`
- `BP.svg`
- etc.

File sizes typically 50-150 KB each (pixel-art representation of32x32).

## Integration

Update `/home/ubuntu/gaspeep/frontend/src/lib/brandIcons.tsx` to reference the SVG files:

```typescript
import Shell from '@/...../icons-svg/Shell.svg';
import BP from '@/...../icons-svg/BP.svg';

export const BRAND_ICONS: Record<string, React.ReactNode> = {
  'Shell': <img src={Shell} alt="Shell" className="w-8 h-8" />,
  'BP': <img src={BP} alt="BP" className="w-8 h-8" />,
  // ... etc
};
```

## Notes

- Brands of the World is a free service - please be respectful of their infrastructure
- The system uses proper user-agent headers and rate limiting
- All downloads are legal and permitted by the service
- SVG files are optimized for display at 32x32 size
