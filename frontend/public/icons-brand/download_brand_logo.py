#!/usr/bin/env python3
"""Download a brand logo SVG from brandsoftheworld.com for one brand."""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote, urlparse, urljoin
from urllib.request import Request, urlopen

BOTW_BASE_URL = "https://www.brandsoftheworld.com"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
TO_32X32_SVG_SCRIPT = Path(__file__).parent / "to_32x32_svg.py"


def encoded_brand_filename(brand: str) -> str:
    return f"{quote(brand, safe='')}.svg"


def fetch_text(url: str, timeout: int = 25) -> str:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="ignore")


def fetch_bytes(url: str, timeout: int = 25) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=timeout) as response:
        return response.read()


def looks_like_svg(payload: bytes, source_url: str) -> bool:
    if Path(urlparse(source_url).path).suffix.lower() == ".svg":
        return True
    head = payload[:512].lstrip().lower()
    return head.startswith(b"<svg") or b"<svg" in head


def extract_search_image_urls(search_url: str, search_html: str) -> list[str]:
    image_urls: list[str] = []
    matches = re.findall(r'(?:src|data-src)=["\']([^"\']+)["\']', search_html, flags=re.IGNORECASE)
    for raw_match in matches:
        candidate = urljoin(search_url, raw_match)
        lower = candidate.lower()
        if not re.search(r"\.(svg|png|jpe?g|webp)(?:[?#].*)?$", lower):
            continue
        if any(token in lower for token in ("placeholder", "logo-botw", "sprite", "avatar", "favicon")):
            continue
        image_urls.append(candidate)

    seen = set()
    unique_urls: list[str] = []
    for url in image_urls:
        if url not in seen:
            seen.add(url)
            unique_urls.append(url)
    return unique_urls


def file_suffix_from_url(image_url: str) -> str:
    suffix = Path(urlparse(image_url).path).suffix.lower()
    if suffix in (".png", ".jpg", ".jpeg", ".webp", ".svg"):
        return suffix
    return ".png"


def save_original_image(image_bytes: bytes, source_url: str, output_dir: Path, brand: str) -> Path:
    originals_dir = output_dir / "_originals"
    originals_dir.mkdir(parents=True, exist_ok=True)
    original_path = originals_dir / f"{quote(brand, safe='')}{file_suffix_from_url(source_url)}"
    original_path.write_bytes(image_bytes)
    return original_path


def find_existing_original(output_dir: Path, brand: str) -> Path | None:
    originals_dir = output_dir / "_originals"
    if not originals_dir.exists():
        return None

    encoded_brand = quote(brand, safe="")
    matches = [
        candidate
        for candidate in originals_dir.glob(f"{encoded_brand}.*")
        if candidate.is_file()
    ]
    if not matches:
        return None

    # Prefer common raster formats first, then svg.
    extension_priority = {
        ".png": 0,
        ".jpg": 1,
        ".jpeg": 2,
        ".webp": 3,
        ".svg": 4,
    }
    matches.sort(key=lambda path: (extension_priority.get(path.suffix.lower(), 99), path.name))
    return matches[0]


def convert_image_to_32x32_svg(image_bytes: bytes, source_url: str, svg_output_path: Path) -> bool:
    if looks_like_svg(image_bytes, source_url):
        svg_output_path.write_bytes(image_bytes)
        return True

    if not TO_32X32_SVG_SCRIPT.exists():
        raise FileNotFoundError(f"32x32 converter not found: {TO_32X32_SVG_SCRIPT}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix_from_url(source_url)) as tmp_file:
        tmp_file.write(image_bytes)
        tmp_image_path = Path(tmp_file.name)

    try:
        result = subprocess.run(
            [sys.executable, str(TO_32X32_SVG_SCRIPT), str(tmp_image_path), str(svg_output_path)],
            capture_output=True,
            text=True,
            timeout=60,
        )
        return result.returncode == 0
    finally:
        try:
            tmp_image_path.unlink(missing_ok=True)
        except Exception:
            pass


def download_brand_logo_svg(brand: str, output_dir: Path) -> Path | None:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / encoded_brand_filename(brand)

    existing_original = find_existing_original(output_dir=output_dir, brand=brand)
    if existing_original:
        payload = existing_original.read_bytes()
        if convert_image_to_32x32_svg(payload, source_url=str(existing_original), svg_output_path=output_path):
            return output_path
        return None

    search_url = f"{BOTW_BASE_URL}/search/logo?search_api_views_fulltext={quote(brand)}"
    search_html = fetch_text(search_url)
    image_urls = extract_search_image_urls(search_url, search_html)
    if not image_urls:
        return None

    for image_url in image_urls:
        try:
            payload = fetch_bytes(image_url)
            save_original_image(payload, source_url=image_url, output_dir=output_dir, brand=brand)
            if convert_image_to_32x32_svg(payload, source_url=image_url, svg_output_path=output_path):
                return output_path
        except Exception:
            continue

    return None


def main() -> int:
    if len(sys.argv) not in (2, 3):
        print("Usage: python3 download_brand_logo.py <brand_name> [output_dir]", file=sys.stderr)
        return 1

    brand = sys.argv[1].strip()
    if not brand:
        print("Brand name cannot be empty", file=sys.stderr)
        return 1

    output_dir = Path(sys.argv[2]) if len(sys.argv) == 3 else Path(__file__).parent

    try:
        result = download_brand_logo_svg(brand, output_dir=output_dir)
    except Exception as exc:
        print(f"Download failed for '{brand}': {exc}", file=sys.stderr)
        return 1

    if not result:
        print(f"No SVG logo found for '{brand}'", file=sys.stderr)
        return 1

    print(str(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
