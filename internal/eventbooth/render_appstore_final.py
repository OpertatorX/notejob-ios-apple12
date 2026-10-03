#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import os

CAP = Path(os.environ.get("EVENTBOOTH_CAPTURES", "/tmp/eb-captures"))
OUT = Path(os.environ.get("EVENTBOOTH_STORE_SHOTS", "/tmp/eb-store-shots"))
BRAND = Path("/tmp/eventbooth-src/EventBooth/Resources/Assets.xcassets/BrandMark.imageset/BrandMark.png")

BG = "#F4EEE5"
INK = "#342A24"
MUTED = "#75665B"
ACCENT = "#B79A72"
PAPER = "#FCF8F1"

font_candidates = {
    "serif": [
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/NewYork.ttf",
        "/Library/Fonts/Georgia.ttf",
    ],
    "sans": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ],
}

def font(kind, size, bold=False):
    choices = list(font_candidates[kind])
    if bold and kind == "serif":
        choices.insert(0, "/System/Library/Fonts/Supplemental/Georgia Bold.ttf")
    if bold and kind == "sans":
        choices.insert(0, "/System/Library/Fonts/Supplemental/Arial Bold.ttf")
    for p in choices:
        if Path(p).exists():
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()

def contain(im, maxw, maxh):
    im = im.copy()
    im.thumbnail((maxw, maxh), Image.Resampling.LANCZOS)
    return im

def rounded_paste(canvas, image, xy, radius, shadow=True, frame=0):
    x, y = xy
    w, h = image.size
    if shadow:
        shadow_layer = Image.new("RGBA", canvas.size, (0,0,0,0))
        sd = ImageDraw.Draw(shadow_layer)
        sd.rounded_rectangle((x-24, y-20, x+w+24, y+h+28), radius=radius+20, fill=(45,32,24,55))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(24))
        canvas.alpha_composite(shadow_layer)
    if frame:
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle((x-frame, y-frame, x+w+frame, y+h+frame), radius=radius+frame, fill="#201C19")
    mask = Image.new("L", (w,h), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,w,h), radius=radius, fill=255)
    canvas.paste(image.convert("RGBA"), (x,y), mask)

def multiline_center(draw, text, center_x, y, fnt, fill, spacing=6):
    draw.multiline_text((center_x, y), text, font=fnt, fill=fill, anchor="ma", align="center", spacing=spacing)

def brand_header(canvas, W, top=70):
    draw = ImageDraw.Draw(canvas)
    if BRAND.exists():
        b = Image.open(BRAND).convert("RGBA")
        b.thumbnail((82,82), Image.Resampling.LANCZOS)
        canvas.alpha_composite(b, ((W-b.width)//2, top))
        y = top + b.height + 18
    else:
        y = top
    draw.text((W//2, y), "EVENT BOOTH", font=font("sans", 26, True), fill=ACCENT, anchor="ma")
    draw.line((W//2-80, y+45, W//2+80, y+45), fill=ACCENT, width=2)
    return y + 82

def make_slide(src, out, size, title, subtitle, index, device):
    W,H = size
    canvas = Image.new("RGBA", size, BG)
    draw = ImageDraw.Draw(canvas)
    head_y = brand_header(canvas, W, int(H*0.025))
    title_size = int(W * (0.064 if device == "iphone" else 0.045))
    sub_size = int(W * (0.026 if device == "iphone" else 0.020))
    multiline_center(draw, title, W//2, head_y+26, font("serif", title_size, True), INK, spacing=12)
    title_box = draw.multiline_textbbox((W//2, head_y+26), title, font=font("serif", title_size, True), anchor="ma", align="center", spacing=12)
    sub_y = title_box[3] + int(H*0.022)
    multiline_center(draw, subtitle, W//2, sub_y, font("sans", sub_size), MUTED, spacing=8)

    raw = Image.open(src).convert("RGB")
    if device == "iphone":
        maxw, maxh = int(W*0.74), int(H*0.67)
        top_min = int(H*0.245)
        radius, frame = 70, 14
    else:
        maxw, maxh = int(W*0.88), int(H*0.69)
        top_min = int(H*0.235)
        radius, frame = 58, 12
    shown = contain(raw, maxw, maxh)
    x = (W-shown.width)//2
    y = max(top_min, int(sub_y + sub_size*2.6))
    if y + shown.height > H - int(H*0.075):
        shown = contain(raw, maxw, H-y-int(H*0.075))
        x = (W-shown.width)//2
    rounded_paste(canvas, shown, (x,y), radius, shadow=True, frame=frame)

    footer_y = H - int(H*0.038)
    draw.text((int(W*0.06), footer_y), f"0{index}", font=font("sans", int(W*0.020), True), fill=ACCENT, anchor="ls")
    draw.text((W-int(W*0.06), footer_y), "PHOTO · VIDEO · VOICE · GUESTBOOK", font=font("sans", int(W*0.015)), fill=MUTED, anchor="rs")
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, "JPEG", quality=96, subsampling=0, optimize=True)

slides = {
    "iphone": {
        "fr": [
            ("events", "Vos événements, simplement", "Créez, retrouvez et préparez chaque moment important."),
            ("dashboard", "Tous vos souvenirs réunis", "Photos, vidéos, voix et mots doux dans un seul espace."),
            ("library", "Une bibliothèque complète", "Retrouvez chaque souvenir créé pendant votre événement."),
            ("booth", "Une borne prête pour le jour J", "Une expérience élégante et simple pour tous vos invités."),
            ("settings", "Tout reste sous votre contrôle", "Thème, fonctions, caméra et retour automatique."),
        ],
        "en": [
            ("events", "Your events, beautifully organized", "Create, find and prepare every important celebration."),
            ("dashboard", "Every memory, together", "Photos, video, voice and guestbook notes in one place."),
            ("library", "A complete memory library", "Keep every moment captured throughout your event."),
            ("booth", "Ready for event day", "An elegant, effortless experience for every guest."),
            ("settings", "Stay in control", "Theme, features, camera and automatic return settings."),
        ],
    },
    "ipad": {
        "fr": [
            ("booth", "Transformez votre iPad en Event Booth", "Quatre façons simples de créer un souvenir."),
            ("dashboard", "Photo, vidéo, voix & livre d’or", "Tout ce que vos invités créent, réuni au même endroit."),
            ("guestbook", "Un livre d’or vraiment personnel", "Messages et signatures pour garder leurs mots avec vous."),
            ("export", "Exportez tous les souvenirs", "Récupérez votre événement et générez votre livre d’or PDF."),
            ("eventSettings", "Personnalisez votre événement", "Adaptez l’expérience à votre style et à vos invités."),
        ],
        "en": [
            ("booth", "Turn your iPad into Event Booth", "Four simple ways for guests to create a memory."),
            ("dashboard", "Photo, video, voice & guestbook", "Everything your guests create, together in one place."),
            ("guestbook", "A guestbook they’ll keep", "Personal notes and signatures worth holding onto."),
            ("export", "Export every memory", "Take your event with you and generate a guestbook PDF."),
            ("eventSettings", "Make every event yours", "Tailor the experience to your style and your guests."),
        ],
    },
}

for device in ("iphone", "ipad"):
    size = (1242,2688) if device == "iphone" else (2064,2752)
    for lang in ("fr", "en"):
        locale = "fr-FR" if lang == "fr" else "en-US"
        for idx, (route,title,sub) in enumerate(slides[device][lang], start=1):
            src = CAP / f"{device}-{route}-{lang}.png"
            if not src.exists():
                raise SystemExit(f"MISSING_CAPTURE={src}")
            out = OUT / locale / device / f"{idx:02d}.jpg"
            make_slide(src, out, size, title, sub, idx, device)
            print(f"RENDERED={out}")

count = len(list(OUT.glob("**/*.jpg")))
if count != 20:
    raise SystemExit(f"STORE_SHOT_COUNT_INVALID={count}")
print("EVENTBOOTH_PROMO_SCREENSHOTS=PASS|count=20")
