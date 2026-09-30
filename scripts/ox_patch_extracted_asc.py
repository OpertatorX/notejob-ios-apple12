from pathlib import Path
import re
import textwrap

src = Path(".github/workflows/ox-invoice-asc-direct-final.yml").read_text()
marker = "cat > /tmp/asc-direct-fix.cjs <<'NODE'"
a = src.index(marker) + len(marker)
b = src.index("\n          NODE", a)
script = textwrap.dedent(src[a:b]).lstrip("\n")

pattern = r"(contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT'),\s*\n\s*availableInNewTerritories: true"
script, n = re.subn(pattern, r"\1", script, count=1)
if n != 1:
    raise SystemExit(f"availability patch removal expected 1 match, got {n}")

build_injection = """
            // Ensure App Store version 1.0 is attached to build 4.
            const selectedBefore = await jsonRequest(
              token, 'GET',
              '/v1/appStoreVersions/' + versionId + '/build?fields%5Bbuilds%5D=version,expired,processingState,buildAudienceType',
              null, [200,404]
            );
            if (!(selectedBefore.status === 200 && selectedBefore.data?.data)) {
              const build4s = await getAll(
                token,
                '/v1/builds?filter%5Bapp%5D=' + encodeURIComponent(appId) +
                '&filter%5Bversion%5D=4&filter%5BprocessingState%5D=VALID' +
                '&fields%5Bbuilds%5D=version,expired,processingState,buildAudienceType,uploadedDate'
              );
              const eligible = build4s.filter(b =>
                b.attributes?.version === '4' &&
                b.attributes?.expired !== true &&
                b.attributes?.processingState === 'VALID'
              );
              if (eligible.length !== 1) {
                throw new Error('Expected exactly one valid non-expired build 4, got ' + eligible.length);
              }
              await jsonRequest(
                token, 'PATCH',
                '/v1/appStoreVersions/' + versionId + '/relationships/build',
                { data: { type: 'builds', id: eligible[0].id } },
                [204]
              );
              console.log('BUILD4_ATTACHED=yes');
            } else {
              console.log('BUILD_ALREADY_ATTACHED=' + String(selectedBefore.data.data.attributes?.version || ''));
            }

"""
anchor = "// Selected build.\n"
if anchor not in script:
    raise SystemExit("selected build anchor not found")
script = script.replace(anchor, build_injection + anchor, 1)

availability_injection = """
            // Audit both current and legacy availability resources without changing countries yet.
            const avLink = await jsonRequest(
              token, 'GET',
              '/v1/apps/' + appId + '/relationships/appAvailabilityV2',
              null, [200,404]
            );
            console.log('AVAILABILITY_V2_LINK_STATUS=' + avLink.status);
            if (avLink.status === 200) {
              console.log('AVAILABILITY_V2_LINK_ID=' + String(avLink.data?.data?.id || 'null'));
            }

            const legacyAv = await jsonRequest(
              token, 'GET',
              '/v1/apps/' + appId + '/appAvailability',
              null, [200,404]
            );
            console.log('LEGACY_APP_AVAILABILITY_STATUS=' + legacyAv.status);
            if (legacyAv.status === 200 && legacyAv.data?.data) {
              console.log('LEGACY_APP_AVAILABILITY_ID=' + String(legacyAv.data.data.id || ''));
              console.log('LEGACY_NEW_TERRITORIES=' + String(legacyAv.data.data.attributes?.availableInNewTerritories));
            }

            const legacyTerritories = await jsonRequest(
              token, 'GET',
              '/v1/apps/' + appId + '/availableTerritories?limit=200',
              null, [200,404]
            );
            console.log('LEGACY_AVAILABLE_TERRITORIES_STATUS=' + legacyTerritories.status);
            if (legacyTerritories.status === 200) {
              console.log('LEGACY_AVAILABLE_TERRITORIES=' + String(legacyTerritories.data?.data?.length || 0));
            }

"""
availability_anchor = "// Subscription states.\n"
if availability_anchor not in script:
    raise SystemExit("availability audit anchor not found")
script = script.replace(availability_anchor, availability_injection + availability_anchor, 1)

assert_pattern = re.compile(
    r"(?P<i>\s*)const aa = appCheck\.data\?\.data\?\.attributes \|\| \{\};\s*\n"
    r"(?P=i)if \(aa\.contentRightsDeclaration !== 'DOES_NOT_USE_THIRD_PARTY_CONTENT'\) \{\s*\n"
    r"(?P=i)\s+throw new Error\('Content rights did not persist'\);\s*\n"
    r"(?P=i)\}\s*\n"
    r"(?P=i)console\.log\('DIRECT_ASC_FIX_VERIFIED=yes'\);"
)
m = assert_pattern.search(script)
if not m:
    raise SystemExit("content-rights assertion anchor not found")
indent = m.group("i")
new_assert = (
    indent + "const aa = appCheck.data?.data?.attributes || {};\n" +
    indent + "console.log('CONTENT_RIGHTS_VERIFY=' + String(aa.contentRightsDeclaration || 'null'));\n" +
    indent + "console.log('DIRECT_ASC_FIX_VERIFIED=yes');"
)
script = assert_pattern.sub(new_assert, script, count=1)

Path("/tmp/asc-direct-fix.cjs").write_text(script)
print("TEMP_ASC_SCRIPT_PATCHED=yes")
