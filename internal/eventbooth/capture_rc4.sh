#!/usr/bin/env bash
set -euo pipefail

ROOT=/tmp/eventbooth-src
DD=/tmp/ebdd
OUT=/tmp/ebshots
rm -rf "$ROOT" "$DD" "$OUT"
mkdir -p "$ROOT" "$OUT"

cat internal/eventbooth/chunks/part*.b64 | tr -d '\n\r' | base64 --decode > /tmp/eb-base.tgz
echo "8a8d2094865775cdd5f1f6b302d527fbd2fda02008bed437706451fb83ee9cd2  /tmp/eb-base.tgz" | shasum -a 256 -c -
tar -xzf /tmp/eb-base.tgz -C "$ROOT"
cp internal/eventbooth/overrides/CameraController.swift "$ROOT/EventBooth/Services/CameraController.swift"

cat internal/eventbooth/rc2/part*.b64 | tr -d '\n\r' | base64 --decode > /tmp/eb-rc2.tgz
echo "6ce64b55c2cbaaffcf43b6bf939d4368158ebf28ede0697f01c46e3913161868  /tmp/eb-rc2.tgz" | shasum -a 256 -c -
tar -xzf /tmp/eb-rc2.tgz -C "$ROOT"

cat internal/eventbooth/rc4patch/part*.txt > /tmp/eb-rc4.patch
(
  cd "$ROOT"
  patch --batch -p1 < /tmp/eb-rc4.patch
)
python3 internal/eventbooth/rc4hotfix.py

curl -L --fail --retry 3 --silent --show-error \
  'https://images.unsplash.com/photo-1503738692489-fff01e3e0f3e?auto=format&fit=crop&fm=jpg&q=82&w=2400' \
  -o "$ROOT/EventBooth/Resources/ScreenshotWedding.jpg"
test -s "$ROOT/EventBooth/Resources/ScreenshotWedding.jpg"

python3 - <<'PY'
from pathlib import Path
p=Path("/tmp/eventbooth-src/EventBooth/App/EventBoothApp.swift")
s=p.read_text()
old='''        .task {
          await purchases.loadProducts()
          await purchases.refreshEntitlements()
        }'''
new='''        .task {
          guard !EBScreenshotMode.isEnabled else { return }
          await purchases.loadProducts()
          await purchases.refreshEntitlements()
        }'''
if old in s:
    p.write_text(s.replace(old,new,1))
PY

command -v xcodegen >/dev/null || brew install xcodegen
(
  cd "$ROOT"
  xcodegen generate
  set -o pipefail
  xcodebuild \
    -project EventBooth.xcodeproj \
    -scheme EventBooth \
    -configuration Debug \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$DD" \
    CODE_SIGNING_ALLOWED=NO \
    build | tee "$OUT/build.log"
)

if grep -E '/tmp/eventbooth-src/EventBooth/.*: warning:' "$OUT/build.log"; then
  echo "SOURCE_WARNING_GATE=FAIL"
  exit 31
fi

APP="$(find "$DD/Build/Products" -path '*Debug-iphonesimulator/EventBooth.app' -type d -print -quit)"
test -d "$APP"

xcrun simctl shutdown all >/dev/null 2>&1 || true
xcrun simctl list devices available -j > /tmp/eb-devices.json
python3 - <<'PY' >/tmp/eb-devices.env
import json
j=json.load(open("/tmp/eb-devices.json"))
ds=[d for group in j["devices"].values() for d in group if d.get("isAvailable")]
phones=[d for d in ds if d["name"].startswith("iPhone")]
pads=[d for d in ds if d["name"].startswith("iPad")]
def pick(items,names):
    for name in names:
        for d in items:
            if d["name"]==name:
                return d["udid"]
    if not items:
        raise SystemExit("No simulator")
    return items[0]["udid"]
print("IPHONE="+pick(phones,["iPhone 16 Pro Max","iPhone 16 Plus","iPhone 16 Pro"]))
print("IPAD="+pick(pads,["iPad Pro 13-inch (M4)","iPad Air 13-inch (M3)","iPad Pro 11-inch (M4)"]))
PY
source /tmp/eb-devices.env

capture_device () {
  local udid="$1"
  local route="$2"
  local lang="$3"
  local locale="$4"
  local out="$5"
  xcrun simctl terminate "$udid" com.operatorx.eventbooth >/dev/null 2>&1 || true
  SIMCTL_CHILD_EVENTBOOTH_SCREEN="$route" \
    xcrun simctl launch "$udid" com.operatorx.eventbooth \
    -AppleLanguages "($lang)" -AppleLocale "$locale" >/dev/null
  sleep 3
  xcrun simctl io "$udid" screenshot "$OUT/$out"
}

xcrun simctl boot "$IPHONE" || true
xcrun simctl bootstatus "$IPHONE" -b
xcrun simctl install "$IPHONE" "$APP"
xcrun simctl ui "$IPHONE" appearance light || true
capture_device "$IPHONE" events fr fr_FR iphone-events-fr.png
capture_device "$IPHONE" dashboard fr fr_FR iphone-dashboard-fr.png
capture_device "$IPHONE" library fr fr_FR iphone-library-fr.png
capture_device "$IPHONE" events en en_US iphone-events-en.png
capture_device "$IPHONE" dashboard en en_US iphone-dashboard-en.png
capture_device "$IPHONE" library en en_US iphone-library-en.png
xcrun simctl shutdown "$IPHONE"

xcrun simctl boot "$IPAD" || true
xcrun simctl bootstatus "$IPAD" -b
xcrun simctl install "$IPAD" "$APP"
xcrun simctl ui "$IPAD" appearance light || true
capture_device "$IPAD" booth fr fr_FR ipad-booth-fr.png
capture_device "$IPAD" dashboard fr fr_FR ipad-dashboard-fr.png
capture_device "$IPAD" guestbook fr fr_FR ipad-guestbook-fr.png
capture_device "$IPAD" booth en en_US ipad-booth-en.png
capture_device "$IPAD" dashboard en en_US ipad-dashboard-en.png
capture_device "$IPAD" guestbook en en_US ipad-guestbook-en.png
xcrun simctl shutdown "$IPAD"

COUNT="$(find "$OUT" -name '*.png' | wc -l | tr -d ' ')"
test "$COUNT" -eq 12
sips -g pixelWidth -g pixelHeight "$OUT"/*.png
echo "RC4_REFERENCE_CAPTURE=PASS"
