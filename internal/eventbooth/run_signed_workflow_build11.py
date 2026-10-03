#!/usr/bin/env python3
from pathlib import Path
import os
import re
import subprocess
import sys
import yaml

repo = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()
workflow_path = repo / ".github/workflows/eventbooth-signed-ipa.yml"
text = workflow_path.read_text()
text = text.replace(
    "name: Event Booth RC8 responsive build 10 signed IPA",
    "name: Event Booth final build 11 signed IPA",
    1,
)
pattern = r'''          python3 "\$GITHUB_WORKSPACE/internal/eventbooth/rc8hotfix\.py"\n          python3 - <<'PY'\n.*?          grep -q 'CURRENT_PROJECT_VERSION: 10' /tmp/eventbooth-src/project\.yml'''
replacement = '''          python3 "$GITHUB_WORKSPACE/internal/eventbooth/rc8hotfix.py"\n          python3 "$GITHUB_WORKSPACE/internal/eventbooth/finalhotfix.py"\n          python3 "$GITHUB_WORKSPACE/internal/eventbooth/approvedicon.py"\n          grep -q 'CURRENT_PROJECT_VERSION: 11' /tmp/eventbooth-src/project.yml\n          test -s /tmp/eventbooth-src/EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png'''
text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f"BUILD11_RECONSTRUCTION_REPLACE_COUNT={count}")
text = text.replace('grep -qx "10"', 'grep -qx "11"')
text = text.replace('name: EventBooth-IPA-build10', 'name: EventBooth-IPA-build11')
if "CURRENT_PROJECT_VERSION: 10" in text or 'grep -qx "10"' in text:
    raise SystemExit("BUILD10_TOKEN_REMAINS")
if "finalhotfix.py" not in text or "approvedicon.py" not in text:
    raise SystemExit("FINAL_HOTFIX_MISSING")

workflow = yaml.safe_load(text)
steps = workflow["jobs"]["ipa"]["steps"]
wanted = [
    "Reconstruct Event Booth source",
    "Install tooling",
    "Resolve distribution certificate and create App Store profile",
    "Install signing assets",
    "Generate Xcode project",
    "Release simulator compile gate",
    "Archive with App Store profile",
    "Export IPA",
]
by_name = {s.get("name"): s for s in steps if isinstance(s, dict) and s.get("name")}
missing = [name for name in wanted if name not in by_name]
if missing:
    raise SystemExit("BUILD11_STEPS_MISSING=" + ",".join(missing))

env = os.environ.copy()
env_file = Path(env.get("GITHUB_ENV", "/tmp/eventbooth-build11.env"))
if "GITHUB_ENV" not in env:
    env["GITHUB_ENV"] = str(env_file)
    env_file.write_text("")

def sync_github_env():
    if not env_file.exists():
        return
    for raw in env_file.read_text(errors="ignore").splitlines():
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        if key and "<<" not in key:
            env[key] = value

for name in wanted:
    step = by_name[name]
    run = step.get("run")
    if not run:
        raise SystemExit(f"BUILD11_EMPTY_STEP={name}")
    cwd = Path(step.get("working-directory", repo))
    if not cwd.is_absolute():
        cwd = repo / cwd
    print(f"::group::{name}", flush=True)
    result = subprocess.run(["bash", "-lc", run], cwd=str(cwd), env=env)
    print("::endgroup::", flush=True)
    if result.returncode != 0:
        raise SystemExit(f"BUILD11_STEP_FAIL={name}|code={result.returncode}")
    sync_github_env()

ipa = next(Path("/tmp/eventbooth-src/artifacts/export").glob("*.ipa"), None)
if not ipa or not ipa.is_file() or ipa.stat().st_size == 0:
    raise SystemExit("BUILD11_IPA_MISSING")
print(f"EVENTBOOTH_BUILD11_IPA={ipa}")
print("EVENTBOOTH_BUILD11_SIGNED=PASS")
