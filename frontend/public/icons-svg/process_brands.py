#!/usr/bin/env python3
"""
Process brands: Download logos and convert to 32x32 SVG.
Features:
- Resumable: Saves progress after each brand
- Graceful error handling: Logs failures and continues
- Signal handling: Ctrl+C saves state before exit
"""
import sys
import os
import json
import subprocess
import signal
import time
from pathlib import Path
from datetime import datetime

# Paths
SCRIPT_DIR = Path(__file__).parent
BRANDS_FILE = SCRIPT_DIR / "brands to process for svg icons"
PROGRESS_FILE = SCRIPT_DIR / "process_log.json"
TEMP_DIR = Path("/tmp/gaspeep_logos")
DOWNLOAD_SCRIPT = SCRIPT_DIR / "download_logo.py"
CONVERT_SCRIPT = SCRIPT_DIR / "to_32x32_svg.py"

# Create temp directory
TEMP_DIR.mkdir(exist_ok=True)

class BrandProcessor:
    def __init__(self):
        self.progress = self.load_progress()
        self.should_exit = False

    def signal_handler(self, sig, frame):
        """Handle Ctrl+C gracefully."""
        print("\n\n⚠️  Interrupt received. Saving progress...")
        self.save_progress()
        print("✓ Progress saved. You can resume later.")
        sys.exit(0)

    def load_progress(self):
        """Load progress from file or create new."""
        if PROGRESS_FILE.exists():
            try:
                with open(PROGRESS_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Could not load progress file: {e}")
                return {
                    "processed": [],
                    "skipped": [],
                    "failed": {},
                    "last_updated": None,
                    "notes": {}
                }
        return {
            "processed": [],
            "skipped": [],
            "failed": {},
            "last_updated": None,
            "notes": {}
        }

    def save_progress(self):
        """Save progress to file."""
        self.progress["last_updated"] = datetime.now().isoformat()
        try:
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(self.progress, f, indent=2)
            print(f"✓ Progress saved to {PROGRESS_FILE}")
        except Exception as e:
            print(f"✗ Error saving progress: {e}")

    def load_brands(self):
        """Load brands from file."""
        if not BRANDS_FILE.exists():
            print(f"✗ Brands file not found: {BRANDS_FILE}")
            sys.exit(1)

        with open(BRANDS_FILE, 'r') as f:
            brands = [line.strip() for line in f if line.strip()]

        print(f"✓ Loaded {len(brands)} brands from {BRANDS_FILE}")
        return brands

    def is_brand_done(self, brand):
        """Check if brand is already processed or skipped."""
        return brand in self.progress["processed"] or brand in self.progress["skipped"]

    def svg_exists(self, brand):
        """Check if SVG already exists for brand."""
        svg_path = SCRIPT_DIR / f"{brand}.svg"
        return svg_path.exists()

    def download_logo(self, brand):
        """Download logo for brand. Returns path or None."""
        try:
            result = subprocess.run(
                ['python3', str(DOWNLOAD_SCRIPT), brand],
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode == 0:
                image_path = result.stdout.strip()
                if Path(image_path).exists():
                    return image_path
            else:
                error_msg = result.stderr.strip() or "Unknown error"
                self.progress["failed"][brand] = f"Download failed: {error_msg}"
                return None

        except subprocess.TimeoutExpired:
            self.progress["failed"][brand] = "Download timeout (120s)"
            return None
        except Exception as e:
            self.progress["failed"][brand] = f"Download error: {str(e)}"
            return None

    def convert_to_svg(self, brand, image_path):
        """Convert image to 32x32 SVG. Returns success/failure."""
        try:
            svg_path = SCRIPT_DIR / f"{brand}.svg"

            result = subprocess.run(
                ['python3', str(CONVERT_SCRIPT), image_path, str(svg_path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                print(f"  ✓ Converted to SVG: {svg_path}")
                return True
            else:
                error_msg = result.stderr.strip() or "Unknown error"
                self.progress["failed"][brand] = f"Conversion failed: {error_msg}"
                print(f"  ✗ Conversion failed: {error_msg}")
                return False

        except subprocess.TimeoutExpired:
            self.progress["failed"][brand] = "Conversion timeout (30s)"
            return False
        except Exception as e:
            self.progress["failed"][brand] = f"Conversion error: {str(e)}"
            return False

    def cleanup_temp(self, image_path):
        """Delete temporary image file."""
        try:
            if Path(image_path).exists():
                os.remove(image_path)
                return True
        except Exception as e:
            print(f"  ⚠️  Could not clean up {image_path}: {e}")
        return False

    def process_brand(self, brand):
        """Process single brand: download and convert. Returns success/skip."""
        print(f"\n{'='*60}")
        print(f"Processing: {brand}")
        print(f"{'='*60}")

        # Check if already processed
        if self.is_brand_done(brand):
            print(f"  ⊘ Already processed (skipping)")
            return "skipped"

        # Check if SVG already exists
        if self.svg_exists(brand):
            print(f"  ⊘ SVG already exists (skipping)")
            self.progress["skipped"].append(brand)
            self.save_progress()
            return "skipped"

        # Download logo
        print(f"  → Downloading logo...")
        image_path = self.download_logo(brand)
        if not image_path:
            print(f"  ✗ Download failed")
            self.progress["processed"].append(brand)  # Mark as processed (even though failed)
            self.save_progress()
            return "failed"

        # Convert to SVG
        print(f"  → Converting to 32x32 SVG...")
        if not self.convert_to_svg(brand, image_path):
            print(f"  ✗ Conversion failed")
            self.progress["processed"].append(brand)
            self.save_progress()
            return "failed"

        # Cleanup
        self.cleanup_temp(image_path)

        # Mark as processed
        self.progress["processed"].append(brand)
        self.save_progress()
        print(f"  ✓ Complete")
        return "success"

    def run(self):
        """Main process loop."""
        # Setup signal handler for Ctrl+C
        signal.signal(signal.SIGINT, self.signal_handler)

        print("\n")
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║       Brand Logo Downloader & SVG Converter               ║")
        print("╚═══════════════════════════════════════════════════════════╝")
        print()

        # Load brands
        brands = self.load_brands()

        # Calculate stats
        total = len(brands)
        already_done = sum(1 for b in brands if self.is_brand_done(b))
        already_skipped = len(self.progress["skipped"])
        already_processed = len(self.progress["processed"])
        already_failed = len(self.progress["failed"])

        print(f"Status:")
        print(f"  Total brands: {total}")
        print(f"  Already processed: {already_processed}")
        print(f"  Already skipped: {already_skipped}")
        print(f"  Already failed: {already_failed}")
        print(f"  Remaining: {total - already_done}")
        print()

        # Process brands
        stats = {"success": 0, "skipped": 0, "failed": 0}

        for i, brand in enumerate(brands, 1):
            if self.is_brand_done(brand):
                continue

            result = self.process_brand(brand)
            if result == "success":
                stats["success"] += 1
            elif result == "skipped":
                stats["skipped"] += 1
            else:
                stats["failed"] += 1

            # Delay between requests (respectful)
            time.sleep(1)

        # Final summary
        print(f"\n\n{'='*60}")
        print(f"FINAL SUMMARY")
        print(f"{'='*60}")
        print(f"Successfully processed: {stats['success']} brands")
        print(f"Skipped (already existed): {stats['skipped']} brands")
        print(f"Failed: {stats['failed']} brands")
        print(f"Total processed this run: {sum(stats.values())} brands")
        print()

        if self.progress["failed"]:
            print(f"Failed brands:")
            for brand, error in self.progress["failed"].items():
                print(f"  - {brand}: {error}")
            print()

        print(f"Progress saved to: {PROGRESS_FILE}")
        print(f"Temporary files location: {TEMP_DIR}")
        print()

        # Calculate final stats from progress file
        all_processed = len(self.progress["processed"])
        all_skipped = len(self.progress["skipped"])
        all_failed = len(self.progress["failed"])
        print(f"Total all-time stats:")
        print(f"  Processed: {all_processed}")
        print(f"  Skipped: {all_skipped}")
        print(f"  Failed: {all_failed}")
        print(f"  Total: {all_processed + all_skipped + all_failed}")

if __name__ == "__main__":
    processor = BrandProcessor()
    processor.run()
