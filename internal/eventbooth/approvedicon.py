from pathlib import Path
import base64
import hashlib
import os
import shutil
import struct
import subprocess
import zlib

root = Path('/tmp/eventbooth-src')
workspace = Path(os.environ['GITHUB_WORKSPACE'])
source_b64 = workspace / 'internal/eventbooth/approvedicon/source256.b64'
source_png = Path('/tmp/eventbooth-approved-icon-256.png')
TARGET_SHA256 = '2e46a72695f52fdbaac966ac8d40a1e9ee656ce37fa00fc3e9abbd9a6689223d'

raw_b64 = ''.join(source_b64.read_text().split())
print(f'APPROVED_ICON_B64_LEN={len(raw_b64)}|mod4={len(raw_b64) % 4}')
# The exact transport defect was isolated by checksum recovery: one "p" was
# dropped at Base64 offset 12933. Repair only that known defect and then enforce
# the SHA-256 of the approved compact artwork.
if len(raw_b64) == 17451:
    raw_b64 = raw_b64[:12933] + 'p' + raw_b64[12933:]
    print('APPROVED_ICON_SOURCE_RECOVERED=yes|position=12933|char=p')
if len(raw_b64) != 17452:
    raise SystemExit(f'APPROVED_ICON_SOURCE_UNEXPECTED_LENGTH={len(raw_b64)}')
decoded = base64.b64decode(raw_b64, validate=True)
actual_source_sha = hashlib.sha256(decoded).hexdigest()
if actual_source_sha != TARGET_SHA256:
    raise SystemExit(f'APPROVED_ICON_SHA_MISMATCH={actual_source_sha}')
source_png.write_bytes(decoded)

def validate_png(path: Path, expected_size):
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit(f'PNG_SIGNATURE_INVALID={path}')
    pos = 8
    width = height = None
    idat = []
    saw_iend = False
    while pos + 12 <= len(data):
        n = struct.unpack('>I', data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        end = pos + 12 + n
        if end > len(data):
            raise SystemExit(f'PNG_TRUNCATED={path}|chunk={typ!r}|end={end}|bytes={len(data)}')
        payload = data[pos+8:pos+8+n]
        expected_crc = struct.unpack('>I', data[pos+8+n:end])[0]
        actual_crc = zlib.crc32(typ + payload) & 0xffffffff
        if expected_crc != actual_crc:
            raise SystemExit(f'PNG_CRC_INVALID={path}|chunk={typ!r}')
        if typ == b'IHDR':
            width, height = struct.unpack('>II', payload[:8])
        elif typ == b'IDAT':
            idat.append(payload)
        elif typ == b'IEND':
            saw_iend = True
            pos = end
            break
        pos = end
    if not saw_iend or pos != len(data):
        raise SystemExit(f'PNG_IEND_INVALID={path}|pos={pos}|bytes={len(data)}')
    if (width, height) != expected_size:
        raise SystemExit(f'PNG_SIZE_INVALID={path}|got={width}x{height}|expected={expected_size[0]}x{expected_size[1]}')
    try:
        zlib.decompress(b''.join(idat))
    except Exception as exc:
        raise SystemExit(f'PNG_IDAT_INVALID={path}|{exc}')
    print(f'PNG_DECODE=PASS|{path.name}|{width}x{height}|bytes={len(data)}')

validate_png(source_png, (256, 256))

icon = root / 'EventBooth/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'
brand = root / 'EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png'
icon.parent.mkdir(parents=True, exist_ok=True)
brand.parent.mkdir(parents=True, exist_ok=True)

if shutil.which('sips'):
    subprocess.check_call(['sips', '-z', '1024', '1024', str(source_png), '--out', str(icon)], stdout=subprocess.DEVNULL)
    shutil.copy2(icon, brand)
elif shutil.which('magick'):
    subprocess.check_call(['magick', str(source_png), '-filter', 'Lanczos', '-resize', '1024x1024!', str(icon)])
    shutil.copy2(icon, brand)
elif shutil.which('convert'):
    subprocess.check_call(['convert', str(source_png), '-filter', 'Lanczos', '-resize', '1024x1024!', str(icon)])
    shutil.copy2(icon, brand)
else:
    print('EVENTBOOTH_APPROVED_ICON_SOURCE=PASS')
    print('APPROVED_ICON_RESIZER=UNAVAILABLE_SOURCE_VALIDATED_ONLY')
    raise SystemExit(0)

validate_png(icon, (1024, 1024))
validate_png(brand, (1024, 1024))
if icon.read_bytes() != brand.read_bytes():
    raise SystemExit('BRANDMARK_MISMATCH')

print(f'APPROVED_ICON_SOURCE={source_png.stat().st_size}|sha256={actual_source_sha}')
print(f'APPROVED_APPICON={icon.stat().st_size}|1024x1024')
print(f'APPROVED_BRANDMARK={brand.stat().st_size}|1024x1024')
print('EVENTBOOTH_APPROVED_ICON=PASS')
