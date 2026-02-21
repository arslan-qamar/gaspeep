#!/usr/bin/env python3
"""Generate lightweight, crisp SVG brand icons for map markers.

Design goals:
- Deterministic output (same brand -> same icon)
- Sharp on all DPI scales
- Small file sizes
- No external network dependencies
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.parse import quote

SCRIPT_DIR = Path(__file__).parent
SHARED_BRANDS_FILE = SCRIPT_DIR.parent / "icon-brands.txt"
LEGACY_BRANDS_FILE = SCRIPT_DIR / "brands to process for svg icons"
MANIFEST_FILE = SCRIPT_DIR / "manifest.json"

PALETTE = [
    ("#0F766E", "#14B8A6"),
    ("#1D4ED8", "#3B82F6"),
    ("#B91C1C", "#EF4444"),
    ("#7C2D12", "#EA580C"),
    ("#1E3A8A", "#2563EB"),
    ("#065F46", "#10B981"),
    ("#7E22CE", "#A855F7"),
    ("#9A3412", "#F97316"),
    ("#0F172A", "#334155"),
    ("#374151", "#6B7280"),
]


def brand_initials(name: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch.isspace() else " " for ch in name)
    words = [w for w in cleaned.split() if w]
    if not words:
        return "?"

    if len(words) == 1:
        token = words[0]
        if len(token) >= 2:
            return token[:2].upper()
        return token[:1].upper()

    return (words[0][0] + words[1][0]).upper()


def choose_colors(brand: str) -> tuple[str, str]:
    digest = hashlib.sha1(brand.encode("utf-8")).digest()
    idx = digest[0] % len(PALETTE)
    return PALETTE[idx]


def svg_icon(brand: str) -> str:
    initials = brand_initials(brand)
    c1, c2 = choose_colors(brand)

    # 64x64 viewBox scales down cleanly to 32x32 in the UI.
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="{brand}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="100%" stop-color="{c2}" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#g)" />
  <rect x="4" y="4" width="56" height="56" rx="16" fill="none" stroke="rgba(255,255,255,0.25)" />
  <text x="32" y="38" text-anchor="middle" font-size="20" font-weight="700" fill="#FFFFFF" font-family="Inter,Segoe UI,Arial,sans-serif" letter-spacing="0.5">{initials}</text>
</svg>
'''


def read_brands() -> list[str]:
    brands_file = SHARED_BRANDS_FILE if SHARED_BRANDS_FILE.exists() else LEGACY_BRANDS_FILE
    if not brands_file.exists():
        raise FileNotFoundError(
            f"Missing brands file: {SHARED_BRANDS_FILE} (or legacy {LEGACY_BRANDS_FILE})"
        )
    return [line.strip() for line in brands_file.read_text().splitlines() if line.strip()]


def main() -> None:
    brands = read_brands()
    manifest: dict[str, str] = {}

    for brand in brands:
        filename = f"{quote(brand, safe='')}.svg"
        output_path = SCRIPT_DIR / filename
        output_path.write_text(svg_icon(brand), encoding="utf-8")
        manifest[brand] = filename

    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Generated {len(brands)} SVG icons")
    print(f"Manifest written to: {MANIFEST_FILE}")


if __name__ == "__main__":
    main()
