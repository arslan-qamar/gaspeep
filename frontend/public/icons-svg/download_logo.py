#!/usr/bin/env python3
"""
Download brand logos using a tiered strategy.
Tier 1: Brands of the World
Tier 2: Google Favicon Service
Tier 3: DuckDuckGo Images (via Playwright)
Tier 4: Manual override
"""
import sys
import os
import json
import subprocess
import time
import socket
import urllib.request
from pathlib import Path
from urllib.parse import quote, urljoin

# Create temp directory for downloads
TEMP_DIR = Path("/tmp/gaspeep_logos")
TEMP_DIR.mkdir(exist_ok=True)

# Load brand domains for favicon fallback
SCRIPT_DIR = Path(__file__).parent
BRAND_DOMAINS_FILE = SCRIPT_DIR / "brand_domains.json"

def load_brand_domains():
    """Load brand to domain mapping."""
    try:
        with open(BRAND_DOMAINS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

BRAND_DOMAINS = load_brand_domains()

def download_file(url, output_path, timeout=30):
    """Download a file from URL to output_path."""
    try:
        print(f"  Downloading from: {url[:80]}...")
        # Use socket timeout context manager for urllib
        import socket
        old_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(timeout)
        try:
            urllib.request.urlretrieve(url, output_path)
        finally:
            socket.setdefaulttimeout(old_timeout)

        size = os.path.getsize(output_path) / 1024  # KB
        print(f"  ✓ Downloaded ({size:.1f} KB)")
        return True
    except Exception as e:
        print(f"  ✗ Download failed: {e}")
        return False

def tier1_brands_of_the_world(brand_name, tier1_timeout=20):
    """
    Tier 1: Try Brands of the World website.
    Returns path to downloaded PNG or None.
    """
    print(f"[Tier 1] Trying Brands of the World (timeout: {tier1_timeout}s)...")
    try:
        # Try to access the brand search and find suitable logo
        search_url = f"https://www.brandsoftheworld.com/search/logo?search_api_views_fulltext={quote(brand_name)}"
        output_path = TEMP_DIR / f"{brand_name}.png"

        print(f"  Navigating to: {search_url[:70]}...")

        # Use curl with strict timeouts
        curl_cmd = [
            'curl', '-s', '-L', '-j', '-b', 'cookies.txt', '-c', 'cookies.txt',
            '--user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            '--connect-timeout', '8',
            '--max-time', '12',
            search_url
        ]

        # Run with strict timeout to prevent hanging
        try:
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=tier1_timeout)
        except subprocess.TimeoutExpired:
            print(f"  ✗ Tier 1 request timeout")
            return None

        if result.returncode == 0 and result.stdout:
            import re

            # Pattern 1: Logo CDN URLs from Brands of the World
            img_urls = re.findall(r'https://d[^/]*\.cloudfront\.net/[^"\'<>\s]+\.(?:png|jpg|jpeg)', result.stdout)

            # Filter out placeholder images
            img_urls = [u for u in img_urls if not any(p in u for p in ['logo-botw', 'hidden-logo', 'placeholder'])]

            if img_urls:
                # Try top 3 images
                for img_url in reversed(img_urls[:3]):
                    if download_file(img_url, output_path, timeout=10):
                        # Verify it's not a tiny placeholder
                        try:
                            size = os.path.getsize(output_path)
                            if size > 1000:  # At least 1KB
                                return str(output_path)
                            else:
                                os.remove(output_path)
                        except:
                            pass

        return None

    except Exception as e:
        print(f"  ✗ Tier 1 failed: {str(e)[:50]}")
        return None

def tier2_google_favicon(brand_name):
    """
    Tier 2: Try Google Favicon service using domain mapping.
    Returns path to downloaded PNG or None.
    """
    print(f"[Tier 2] Trying Google Favicon Service...")
    try:
        domain = BRAND_DOMAINS.get(brand_name)
        if not domain:
            print(f"  No domain mapping found for {brand_name}")
            return None

        favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
        output_path = TEMP_DIR / f"{brand_name}.png"

        if download_file(favicon_url, output_path, timeout=10):
            return str(output_path)

        return None

    except Exception as e:
        print(f"  ✗ Tier 2 failed: {e}")
        return None

def tier3_duckduckgo_images(brand_name):
    """
    Tier 3: Try DuckDuckGo Images search (requires Playwright).
    Returns path to downloaded PNG or None.
    """
    print(f"[Tier 3] Trying DuckDuckGo Images (via browser)...")
    try:
        # This would require Playwright skill to automate browser
        # For now, we'll skip this as it requires interactive skill invocation
        print(f"  ⓘ Skipping DuckDuckGo (requires browser automation)")
        return None

    except Exception as e:
        print(f"  ✗ Tier 3 failed: {e}")
        return None

def tier4_manual_override(brand_name):
    """
    Tier 4: Check if user has manually placed a file.
    Returns path if found, None otherwise.
    """
    print(f"[Tier 4] Checking for manual override...")
    try:
        manual_path = TEMP_DIR / f"{brand_name}.png"
        if manual_path.exists():
            print(f"  ✓ Found manual override at {manual_path}")
            return str(manual_path)

        # Also check for PNG or JPG
        for ext in ['.jpg', '.jpeg', '.gif']:
            alt_path = TEMP_DIR / f"{brand_name}{ext}"
            if alt_path.exists():
                print(f"  ✓ Found manual override at {alt_path}")
                return str(alt_path)

        print(f"  No manual override found")
        return None

    except Exception as e:
        print(f"  ✗ Tier 4 failed: {e}")
        return None

def download_logo(brand_name, overall_timeout=90):
    """
    Download logo for brand using tiered strategy.
    Returns path to downloaded image or None on failure.
    """
    print(f"\nDownloading logo for: {brand_name}")
    start_time = time.time()

    def time_left():
        return max(1, overall_timeout - (time.time() - start_time))

    try:
        # Check each tier in order
        if time_left() > 20:
            result = tier1_brands_of_the_world(brand_name, tier1_timeout=int(time_left() - 5))
            if result:
                print(f"✓ Success via Brands of the World")
                return result

        if time_left() > 15:
            time.sleep(1)  # Respectful delay
            result = tier2_google_favicon(brand_name)
            if result:
                print(f"✓ Success via Google Favicon")
                return result

        if time_left() > 10:
            time.sleep(1)  # Respectful delay
            result = tier3_duckduckgo_images(brand_name)
            if result:
                print(f"✓ Success via DuckDuckGo Images")
                return result

        result = tier4_manual_override(brand_name)
        if result:
            print(f"✓ Success via manual override")
            return result

        print(f"✗ Failed to download logo for {brand_name}")
        return None

    except Exception as e:
        print(f"✗ Download error: {str(e)[:60]}")
        return None
    finally:
        elapsed = time.time() - start_time
        if elapsed > overall_timeout * 0.8:
            print(f"  ⚠️  Download took {elapsed:.1f}s (limit: {overall_timeout}s)")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 download_logo.py <brand_name>")
        print("  Outputs path to downloaded PNG on success")
        print("  Exits with code 1 on failure")
        sys.exit(1)

    brand_name = sys.argv[1]
    result = download_logo(brand_name)

    if result:
        print(f"\n{result}")
        sys.exit(0)
    else:
        sys.exit(1)
