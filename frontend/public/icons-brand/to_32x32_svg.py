#!/usr/bin/env python3
from PIL import Image
import sys

def image_to_32x32_svg(input_path, output_path):
    """
    Convert any image to exactly 32x32 SVG pixel art
    """
    # Open and force resize to exactly 32x32
    img = Image.open(input_path)
    img = img.resize((32, 32), Image.Resampling.NEAREST)  # NEAREST preserves hard edges
    
    # Convert to RGB (remove alpha if present)
    if img.mode in ('RGBA', 'LA'):
        # Create white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    else:
        img = img.convert('RGB')
    
    pixels = img.load()
    
    # Start SVG with exactly 32x32 viewBox
    svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">']
    
    # Create a rectangle for each pixel
    colors_used = set()
    for y in range(32):
        for x in range(32):
            r, g, b = pixels[x, y]
            color = f"#{r:02x}{g:02x}{b:02x}"
            colors_used.add(color)
            svg.append(f'  <rect x="{x}" y="{y}" width="1" height="1" fill="{color}"/>')
    
    svg.append('</svg>')
    
    # Write to file
    with open(output_path, 'w') as f:
        f.write('\n'.join(svg))
    
    print(f"Created 32x32 SVG: {output_path}")
    print(f"Unique colors used: {len(colors_used)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 to_32x32_svg.py input.png output.svg")
        sys.exit(1)
    
    image_to_32x32_svg(sys.argv[1], sys.argv[2])