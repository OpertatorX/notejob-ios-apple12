from pathlib import Path
import base64
import os
import plistlib
import re

root = Path("/tmp/eventbooth-src")
workspace = Path(os.environ["GITHUB_WORKSPACE"])

def replace_once(path, old, new):
    p = root / path
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"FINAL_PATTERN_MISSING={path}")
    p.write_text(text.replace(old, new, 1))
    print(f"FINAL_PATCHED={path}")

def decode_parts(pattern, destination):
    parts = sorted(workspace.glob(pattern))
    if not parts:
        raise SystemExit(f"FINAL_ASSET_PARTS_MISSING={pattern}")
    raw = "".join(p.read_text().strip() for p in parts)
    data = base64.b64decode(raw)
    dest = root / destination
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    print(f"FINAL_ASSET={destination}|{len(data)}")

replace_once(
    "EventBooth/App/EventBoothApp.swift",
'''        .task {
          await purchases.loadProducts()
          await purchases.refreshEntitlements()
        }''',
'''        .task {
          guard !EBScreenshotMode.isEnabled else { return }
          await purchases.loadProducts()
          await purchases.refreshEntitlements()
        }'''
)

replace_once(
    "EventBooth/Features/Events/EventsHomeView.swift",
'''          Image(systemName: "person.crop.circle")
            .font(.system(size: 20))
            .frame(width: 38, height: 38)
            .background(Color.ebPaper, in: Circle())
            .overlay { Circle().stroke(Color.ebLine, lineWidth: 0.8) }''',
'''          Image("BrandMark")
            .resizable()
            .scaledToFit()
            .padding(7)
            .frame(width: 42, height: 42)
            .background(Color.ebPaper, in: Circle())
            .overlay { Circle().stroke(Color.ebLine, lineWidth: 0.8) }
            .accessibilityLabel("Event Booth")'''
)

replace_once(
    "EventBooth/DesignSystem/DesignSystem.swift",
'''        EBLeafMark(color: .white.opacity(0.92))
          .frame(width: 60, height: 48)''',
'''        Image("BrandMark")
          .resizable()
          .scaledToFit()
          .frame(width: 82, height: 82)
          .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
          .shadow(color: .black.opacity(0.15), radius: 10, y: 3)
          .accessibilityHidden(true)'''
)

replace_once(
    "EventBooth/Features/Booth/BoothHomeView.swift",
'''      EBLeafMark(color: .white)
        .frame(width: 58, height: 46)
        .frame(width: 66, height: 56, alignment: .leading)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 1.8) { showingPIN = true }''',
'''      Image("BrandMark")
        .resizable()
        .scaledToFit()
        .frame(width: 46, height: 46)
        .clipShape(Circle())
        .frame(width: 66, height: 56, alignment: .leading)
        .shadow(color: .black.opacity(0.28), radius: 8, y: 2)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 1.8) { showingPIN = true }
        .accessibilityLabel("Event Booth")'''
)

replace_once(
    "EventBooth/Features/Booth/BoothHomeView.swift",
'''    case .classic:
      LinearGradient(
        colors: [.black.opacity(0.08), .clear, .black.opacity(0.36)],
        startPoint: .top,
        endPoint: .bottom
      )''',
'''    case .classic:
      LinearGradient(
        stops: [
          .init(color: .black.opacity(0.34), location: 0.00),
          .init(color: .black.opacity(0.12), location: 0.38),
          .init(color: .black.opacity(0.24), location: 0.64),
          .init(color: .black.opacity(0.48), location: 1.00),
        ],
        startPoint: .top,
        endPoint: .bottom
      )'''
)

decode_parts(
    "internal/eventbooth/finalassets/appicon.part*.b64",
    "EventBooth/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
)
brand_png = root / "EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png"
brand_png.parent.mkdir(parents=True, exist_ok=True)
brand_png.write_bytes((root / "EventBooth/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png").read_bytes())
print(f"FINAL_ASSET=EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png|{brand_png.stat().st_size}")

brand_contents = root / "EventBooth/Resources/Assets.xcassets/BrandMark.imageset/Contents.json"
brand_contents.write_text("""{
  "images" : [
    { "filename" : "BrandMark.png", "idiom" : "universal", "scale" : "1x" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
""")

project = root / "project.yml"
project_text = project.read_text()
project_text = re.sub(r"CURRENT_PROJECT_VERSION:\s*\d+", "CURRENT_PROJECT_VERSION: 11", project_text, count=1)
project.write_text(project_text)

operatorx = root / "app.operatorx.json"
if operatorx.exists():
    s = operatorx.read_text()
    s = re.sub(r'"build"\s*:\s*\d+', '"build": 11', s, count=1)
    operatorx.write_text(s)

plist_path = root / "EventBooth/Info.plist"
with plist_path.open("rb") as f:
    plist = plistlib.load(f)
plist["CFBundleIconName"] = "AppIcon"
plist["UIUserInterfaceStyle"] = "Light"
with plist_path.open("wb") as f:
    plistlib.dump(plist, f, sort_keys=False)

fr_meta = """Nom: Event Booth – Livre d’or
Sous-titre: Photobooth & souvenirs
Description:
Transformez votre iPhone ou iPad en borne à souvenirs élégante pour un mariage, un anniversaire, une fête ou un événement privé.

Avec Event Booth, vos invités peuvent :
• prendre des photos avec compte à rebours ;
• laisser des messages vidéo ;
• enregistrer des messages vocaux ;
• écrire et signer un livre d’or numérique.

Pensé pour le jour J :
• fonctionnement local, même sans connexion Internet ;
• retour automatique à l’écran d’accueil entre deux invités ;
• code PIN organisateur pour quitter le mode Borne ;
• choix du thème, de la caméra et des fonctions activées ;
• partage via la feuille de partage iOS ;
• bibliothèque de tous les souvenirs ;
• export complet de l’événement et génération d’un livre d’or PDF.

Aucun compte Event Booth n’est requis. Aucune publicité et aucun suivi publicitaire.

Vous pouvez tester la borne avec jusqu’à 3 souvenirs. Pour aller plus loin, le Pass Événement débloque un événement avec souvenirs illimités. Event Booth Pro permet de créer des événements illimités pendant la durée de l’abonnement annuel.

Créez votre événement, posez l’iPad ou l’iPhone à l’endroit idéal, activez Accès guidé si vous souhaitez une vraie borne en libre-service, puis laissez vos invités créer les souvenirs.

Mots-clés: photobooth,mariage,livre d'or,photo,vidéo,audio,événement,souvenirs,borne
"""
en_meta = """Name: Event Booth – Guestbook
Subtitle: Photo Booth & Memories
Description:
Turn your iPhone or iPad into an elegant memory booth for weddings, birthdays, parties, and private events.

With Event Booth, guests can:
• take photos with a countdown;
• leave video messages;
• record voice messages;
• write and sign a digital guestbook.

Built for event day:
• local, offline-first operation;
• automatic return to the booth home screen between guests;
• organizer PIN to exit Booth mode;
• configurable theme, camera, and enabled features;
• sharing through the native iOS Share Sheet;
• one library for every memory;
• complete event export and guestbook PDF generation.

No Event Booth account is required. There are no ads and no advertising tracking.

You can try the booth with up to 3 memories. Event Pass unlocks one event with unlimited memories. Event Booth Pro lets you create unlimited events while the annual subscription is active.

Create your event, place your iPhone or iPad where guests can use it, enable iOS Guided Access for a kiosk-style setup if desired, and let everyone capture the moments you will want to keep.

Keywords: photobooth,wedding,guestbook,photo,video,audio,event,memories,kiosk
"""
(root / "apple/fr-FR/metadata.txt").write_text(fr_meta)
(root / "apple/en-US/metadata.txt").write_text(en_meta)

print("EVENTBOOTH_FINAL_HOTFIX=PASS")
