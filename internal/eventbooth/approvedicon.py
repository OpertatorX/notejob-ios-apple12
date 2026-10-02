from pathlib import Path
import base64
import os
import subprocess
import sys

root = Path('/tmp/eventbooth-src')
workspace = Path(os.environ['GITHUB_WORKSPACE'])
source_b64 = workspace / 'internal/eventbooth/approvedicon/source256.b64'
source_png = Path('/tmp/eventbooth-approved-icon-256.png')
source_png.write_bytes(base64.b64decode(''.join(source_b64.read_text().split()), validate=True))

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--disable-pip-version-check', '--quiet', 'pillow'])
    from PIL import Image

with Image.open(source_png) as im:
    im.load()
    if im.size != (256, 256):
        raise SystemExit(f'APPROVED_ICON_SOURCE_SIZE_INVALID={im.size}')
    rgb = im.convert('RGB')
    # The 256 source is a palette-preserving reduction of the approved premium
    # artwork. Upscale with Lanczos so App Store marketing artwork remains 1024px.
    final = rgb.resize((1024, 1024), Image.Resampling.LANCZOS)

icon = root / 'EventBooth/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'
brand = root / 'EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png'
icon.parent.mkdir(parents=True, exist_ok=True)
brand.parent.mkdir(parents=True, exist_ok=True)
final.save(icon, format='PNG', optimize=True)
final.save(brand, format='PNG', optimize=True)

# Fully decode the files again. A PNG signature/hash check alone is not enough:
# the earlier transport bug produced a header-valid but truncated IDAT stream.
for p in (icon, brand):
    with Image.open(p) as chk:
        chk.load()
        if chk.size != (1024, 1024):
            raise SystemExit(f'APPROVED_ICON_OUTPUT_SIZE_INVALID={p}:{chk.size}')

print(f'APPROVED_ICON_SOURCE={source_png.stat().st_size}')
print(f'APPROVED_APPICON={icon.stat().st_size}|1024x1024')
print(f'APPROVED_BRANDMARK={brand.stat().st_size}|1024x1024')
print('EVENTBOOTH_APPROVED_ICON=PASS')
