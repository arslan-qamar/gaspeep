#!/usr/bin/env python3
"""Fetch official brand logos from Brands of the World into icons-brand."""

from __future__ import annotations

import argparse
import json
import signal
from datetime import datetime, timezone
from pathlib import Path

from download_brand_logo import download_brand_logo_svg, encoded_brand_filename

SCRIPT_DIR = Path(__file__).parent
DEFAULT_BRANDS_FILE = SCRIPT_DIR.parent / "icon-brands.txt"
DEFAULT_MANIFEST_FILE = SCRIPT_DIR / "manifest.json"
DEFAULT_PROCESS_LOG_FILE = SCRIPT_DIR / "process_log.json"


def read_brands(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch brand SVG logos from brandsoftheworld.com")
    parser.add_argument("--brands-file", type=Path, default=DEFAULT_BRANDS_FILE)
    parser.add_argument("--output-dir", type=Path, default=SCRIPT_DIR)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_FILE)
    parser.add_argument("--log", type=Path, default=DEFAULT_PROCESS_LOG_FILE)
    parser.add_argument("--force", action="store_true", help="Re-download logos even if file already exists")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of brands to process")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.brands_file.exists():
        raise SystemExit(f"Brands file not found: {args.brands_file}")

    brands = read_brands(args.brands_file)
    manifest = load_json(args.manifest, {})
    process_log = load_json(
        args.log,
        {"processed": [], "failed": {}, "updated_at": None},
    )
    processed_set = set(process_log.get("processed", []))
    failed_map = dict(process_log.get("failed", {}))

    should_stop = {"value": False}

    def handle_interrupt(_sig, _frame):
        should_stop["value"] = True
        print("\nInterrupt received. Finishing current brand, then saving progress.")

    signal.signal(signal.SIGINT, handle_interrupt)

    done = 0
    failed = 0
    attempted = 0

    for brand in brands:
        if should_stop["value"]:
            break
        if args.limit and attempted >= args.limit:
            break

        filename = encoded_brand_filename(brand)
        output_path = args.output_dir / filename
        attempted += 1

        if output_path.exists() and not args.force:
            manifest[brand] = filename
            if brand not in processed_set:
                process_log["processed"].append(brand)
                processed_set.add(brand)
            print(f"[skip] {brand} -> {filename} (already exists)")
            continue

        print(f"[fetch] {brand}")
        try:
            downloaded_path = download_brand_logo_svg(brand, output_dir=args.output_dir)
            if downloaded_path:
                manifest[brand] = downloaded_path.name
                failed_map.pop(brand, None)
                if brand not in processed_set:
                    process_log["processed"].append(brand)
                    processed_set.add(brand)
                done += 1
                print(f"  [ok] {downloaded_path.name}")
            else:
                failed += 1
                failed_map[brand] = "No SVG logo found on brandsoftheworld.com"
                print("  [fail] no SVG logo found")
        except Exception as exc:
            failed += 1
            failed_map[brand] = str(exc)
            print(f"  [fail] {exc}")

        process_log["failed"] = failed_map
        process_log["updated_at"] = datetime.now(timezone.utc).isoformat()
        save_json(args.manifest, manifest)
        save_json(args.log, process_log)

    process_log["failed"] = failed_map
    process_log["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_json(args.manifest, manifest)
    save_json(args.log, process_log)

    print("\nSummary")
    print(f"- Total brands in list: {len(brands)}")
    print(f"- Attempted this run: {attempted}")
    print(f"- Downloaded this run: {done}")
    print(f"- Failed this run: {failed}")
    print(f"- Manifest: {args.manifest}")
    print(f"- Log: {args.log}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
