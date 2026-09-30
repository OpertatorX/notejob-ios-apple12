from PIL import Image, ImageDraw, ImageFont
import os, textwrap

W,H=1242,2688
BG="#F6F7F8"; NAVY="#0A2540"; MUTED="#667085"; FAINT="#98A2B3"
LINE="#E6E8EC"; WHITE="#FFFFFF"; BLUE="#276EF1"; GREEN="#16875D"
RED="#D92D20"; AMBER="#B54708"; SOFT="#F0F3F6"; BLUE_SOFT="#EAF2FF"; GREEN_SOFT="#E8F6F0"
font_reg="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def F(size,bold=False): return ImageFont.truetype(font_bold if bold else font_reg,size)
def rr(d,xy,r,fill,outline=None,width=1): d.rounded_rectangle(xy,radius=r,fill=fill,outline=outline,width=width)
def txt(d,xy,s,size,fill=NAVY,bold=False,anchor=None,align="left"): d.text(xy,s,font=F(size,bold),fill=fill,anchor=anchor,align=align)
def fit_center(d,s,y,maxw,size,fill=NAVY,bold=True):
    while size>30 and d.textbbox((0,0),s,font=F(size,bold))[2]>maxw: size-=2
    txt(d,(W//2,y),s,size,fill,bold,anchor="ma")

def base(title,subtitle):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.ellipse((-180,-220,360,320),fill="#E5F0FF")
    d.ellipse((930,40,1450,560),fill="#EAF2FF")
    d.ellipse((980,2050,1500,2600),fill="#E4EEFF")
    fit_center(d,title,100,1100,82,NAVY,True)
    yy=220
    for line in textwrap.wrap(subtitle,width=42):
        fit_center(d,line,yy,1040,45,MUTED,False); yy+=58
    rr(d,(82,405,1160,2580),78,"#0B0B0C")
    rr(d,(108,430,1134,2552),64,WHITE)
    txt(d,(160,470),"10:38",34,"#000",True)
    txt(d,(965,470),"▮▮▮  Wi‑Fi",24,"#000",True)
    rr(d,(1000,446,1095,486),12,"#FFFFFF",outline="#667085",width=2)
    d.rectangle((1007,453,1020,479),fill="#EF4444")
    return im,d

def nav(d,active,lang):
    labels=(["Accueil","Clients","Prestations","Documents","Plus"] if lang=="fr" else ["Home","Clients","Services","Documents","More"])
    x0,y0,x1,y1=145,2320,1097,2490
    rr(d,(x0,y0,x1,y1),30,WHITE,outline=LINE,width=2)
    for i,l in enumerate(labels):
        cx=x0+95+i*190
        fill=NAVY if i==active else FAINT
        txt(d,(cx,y0+42),["⌂","◉","◆","▤","•••"][i],33,fill,True,anchor="ma")
        txt(d,(cx,y0+108),l,22,fill,True,anchor="ma")

def docrow(d,y,initial,name,meta,amount,status,status_color):
    rr(d,(160,y,1080,y+155),0,WHITE)
    rr(d,(185,y+27,255,y+97),18,BLUE_SOFT)
    txt(d,(220,y+63),initial,24,BLUE,True,anchor="mm")
    txt(d,(290,y+30),name,28,NAVY,True)
    txt(d,(290,y+73),meta,21,MUTED)
    txt(d,(1020,y+30),amount,28,NAVY,True,anchor="ra")
    pillfill=GREEN_SOFT if status_color==GREEN else BLUE_SOFT if status_color==BLUE else SOFT
    rr(d,(865,y+80,1025,y+125),22,pillfill)
    txt(d,(945,y+102),status,20,status_color,True,anchor="mm")
    d.line((160,y+154,1080,y+154),fill=LINE,width=2)

def render_home(lang):
    im,d=base("Pilotez votre activité" if lang=="fr" else "Run your business",
              "Devis, factures et indicateurs clés au même endroit." if lang=="fr" else "Quotes, invoices, and key metrics in one place.")
    txt(d,(165,560),"OX INVOICE",23,FAINT,True)
    txt(d,(165,605),"Bonjour" if lang=="fr" else "Hello",55,NAVY,True)
    txt(d,(165,680),"Votre activité en un coup d’œil." if lang=="fr" else "See your activity at a glance.",30,MUTED)
    metrics=[("2 450,00 €","À recevoir" if lang=="fr" else "Unpaid",AMBER),("5 320,00 €","Payé" if lang=="fr" else "Paid",GREEN),("780,00 €","En retard" if lang=="fr" else "Overdue",RED),("3","En attente" if lang=="fr" else "Pending",BLUE)]
    for idx,(v,l,c) in enumerate(metrics):
        col=idx%2; rowi=idx//2; x=160+col*470; y=760+rowi*190
        rr(d,(x,y,x+430,y+160),24,WHITE,outline=LINE,width=2); txt(d,(x+34,y+34),v,37,c,True); txt(d,(x+34,y+95),l,24,MUTED,True)
    rr(d,(160,1155,585,1270),22,NAVY); rr(d,(610,1155,1040,1270),22,WHITE,outline="#D0D5DD",width=2)
    txt(d,(372,1212),"+ "+("Nouveau devis" if lang=="fr" else "New quote"),28,WHITE,True,anchor="mm")
    txt(d,(825,1212),"+ "+("Nouvelle facture" if lang=="fr" else "New invoice"),26,NAVY,True,anchor="mm")
    txt(d,(160,1350),"Documents récents" if lang=="fr" else "Recent documents",38,NAVY,True)
    txt(d,(1040,1350),"Tout voir" if lang=="fr" else "See all",25,BLUE,True,anchor="ra")
    rr(d,(160,1415,1080,1955),28,WHITE,outline=LINE,width=2)
    vals=[("B","Boulangerie Martin" if lang=="fr" else "Martin Bakery","FAC-2026-0004 · 2026-10-02","1 250,00 €","Payée" if lang=="fr" else "Paid",GREEN),("D","Dupont Conseil" if lang=="fr" else "Dupont Consulting","DEV-2026-0003 · 2026-10-01","980,00 €","Envoyé" if lang=="fr" else "Sent",BLUE),("L","Leclerc & Fils" if lang=="fr" else "Leclerc & Sons","EST-2026-0002 · 2026-09-28","0,00 €","Brouillon" if lang=="fr" else "Draft",MUTED)]
    y=1445
    for v in vals: docrow(d,y,*v); y+=165
    nav(d,0,lang); return im

def render_clients(lang):
    im,d=base("Gérez vos clients" if lang=="fr" else "Manage your clients",
              "Retrouvez chaque contact et son historique en un instant." if lang=="fr" else "Find every contact and its history instantly.")
    txt(d,(160,610),"Clients",55,NAVY,True)
    rr(d,(160,715,1080,810),24,WHITE,outline=LINE,width=2); txt(d,(205,748),"Rechercher un client…" if lang=="fr" else "Search a client…",27,FAINT)
    rr(d,(160,850,1080,1530),28,WHITE,outline=LINE,width=2)
    people=[("LD","Legrand Design","contact@legrand-design.fr","12 doc." if lang=="fr" else "12 docs."),("BM","Boulangerie Martin" if lang=="fr" else "Martin Bakery","contact@martin-bakery.fr","8 doc." if lang=="fr" else "8 docs."),("PC","Petit Commerce" if lang=="fr" else "Small Business Co.","info@petit-commerce.fr","3 doc." if lang=="fr" else "3 docs."),("SH","Studio Horizon" if lang=="fr" else "Horizon Studio","hello@studio-horizon.fr","6 doc." if lang=="fr" else "6 docs.")]
    y=880
    for ini,n,m,c in people:
        rr(d,(190,y+10,265,y+85),20,SOFT); txt(d,(228,y+48),ini,23,NAVY,True,anchor="mm"); txt(d,(300,y+8),n,28,NAVY,True); txt(d,(300,y+52),m,22,MUTED); txt(d,(1030,y+28),c,22,MUTED,True,anchor="ra"); d.line((160,y+120,1080,y+120),fill=LINE,width=2); y+=150
    hint="Touchez un client pour créer une facture. Appui long pour le retirer de la liste." if lang=="fr" else "Tap a client to create an invoice. Long-press to remove it from the list."
    for j,line in enumerate(textwrap.wrap(hint,70)): fit_center(d,line,1595+j*36,950,24,FAINT,False)
    nav(d,1,lang); return im

def render_services(lang):
    im,d=base("Réutilisez vos prestations" if lang=="fr" else "Reuse your services",
              "Gagnez du temps avec vos services et tarifs enregistrés." if lang=="fr" else "Save time with stored services and prices.")
    txt(d,(160,610),"Prestations" if lang=="fr" else "Services",55,NAVY,True)
    rr(d,(160,715,1080,810),24,WHITE,outline=LINE,width=2); txt(d,(205,748),"Rechercher une prestation…" if lang=="fr" else "Search a service…",27,FAINT)
    rr(d,(160,850,1080,1510),28,WHITE,outline=LINE,width=2)
    items=[("Création de site web" if lang=="fr" else "Website creation","Site vitrine sur mesure" if lang=="fr" else "Custom showcase site","1 250,00 €"),("Identité visuelle" if lang=="fr" else "Brand identity","Logo et charte graphique" if lang=="fr" else "Logo and brand guidelines","750,00 €"),("Maintenance mensuelle" if lang=="fr" else "Monthly maintenance","Mises à jour et support" if lang=="fr" else "Updates and support","120,00 €"),("Conseil et audit" if lang=="fr" else "Consulting and audit","Analyse et recommandations" if lang=="fr" else "Analysis and recommendations","350,00 €")]
    y=880
    for n,m,a in items:
        rr(d,(190,y+10,265,y+85),20,BLUE_SOFT); txt(d,(228,y+48),"S",24,BLUE,True,anchor="mm"); txt(d,(300,y+8),n,27,NAVY,True); txt(d,(300,y+52),m,21,MUTED); txt(d,(1030,y+30),a,26,NAVY,True,anchor="ra"); d.line((160,y+120,1080,y+120),fill=LINE,width=2); y+=150
    fit_center(d,"Astuce : appui long pour supprimer une prestation sauvegardée." if lang=="fr" else "Tip: long press to remove a saved service.",1570,980,24,FAINT,False)
    nav(d,2,lang); return im

def render_documents(lang):
    im,d=base("Suivez vos documents" if lang=="fr" else "Track your documents",
              "Gardez chaque devis et facture sous contrôle." if lang=="fr" else "Keep every quote and invoice under control.")
    txt(d,(160,580),"Documents",55,NAVY,True)
    rr(d,(960,555,1080,675),28,NAVY); txt(d,(1020,614),"+",48,WHITE,True,anchor="mm")
    rr(d,(160,715,1080,805),24,SOFT)
    labels=["Tous","Devis","Factures"] if lang=="fr" else ["All","Quotes","Invoices"]
    for i,l in enumerate(labels):
        x=160+i*306; fill=NAVY if i==0 else SOFT; rr(d,(x,715,x+306,805),24,fill); txt(d,(x+153,760),l,24,WHITE if i==0 else MUTED,True,anchor="mm")
    rr(d,(160,835,1080,930),24,WHITE,outline=LINE,width=2); txt(d,(205,868),"Rechercher un document…" if lang=="fr" else "Search a document…",27,FAINT)
    rr(d,(160,965,1080,1980),28,WHITE,outline=LINE,width=2)
    items=[("F","Facture rénovation" if lang=="fr" else "Renovation invoice","FAC-2024-012 · 2024-10-15","1 250,00 €","Payée" if lang=="fr" else "Paid",GREEN),("D","Devis site web" if lang=="fr" else "Website quote","DEV-2024-008 · 2024-10-10","950,00 €","Envoyée" if lang=="fr" else "Sent",BLUE),("F","Facture maintenance" if lang=="fr" else "Maintenance invoice","FAC-2024-007 · 2024-10-04","320,00 €","Brouillon" if lang=="fr" else "Draft",MUTED),("D","Devis conseil" if lang=="fr" else "Consulting quote","DEV-2024-006 · 2024-09-28","480,00 €","Accepté" if lang=="fr" else "Approved",GREEN),("F","Facture formation" if lang=="fr" else "Training invoice","FAC-2024-005 · 2024-09-20","780,00 €","Payée" if lang=="fr" else "Paid",GREEN)]
    y=990
    for v in items: docrow(d,y,*v); y+=185
    nav(d,3,lang); return im

def render_pdf(lang):
    im,d=base("Partagez des PDF pro" if lang=="fr" else "Share pro PDFs",
              "Envoyez des documents nets et prêts à facturer." if lang=="fr" else "Send clean documents ready to bill.")
    txt(d,(150,540),"‹",58,NAVY); txt(d,(160,620),"Aperçu" if lang=="fr" else "Preview",55,NAVY,True); txt(d,(160,690),"FAC-2026-012",22,FAINT,True)
    rr(d,(160,755,570,850),20,WHITE,outline="#D0D5DD",width=2); txt(d,(365,803),"Modifier" if lang=="fr" else "Edit",26,NAVY,True,anchor="mm")
    rr(d,(600,755,1080,850),20,NAVY); txt(d,(840,803),"Partager le PDF" if lang=="fr" else "Share PDF",26,WHITE,True,anchor="mm")
    rr(d,(160,900,1080,2030),26,WHITE,outline=LINE,width=2)
    txt(d,(200,950),"OX INVOICE",32,NAVY,True); txt(d,(1020,950),"FACTURE" if lang=="fr" else "INVOICE",34,NAVY,True,anchor="ra"); txt(d,(1020,995),"#FAC-2026-012",21,MUTED,True,anchor="ra")
    txt(d,(200,1035),"OX Solutions",27,NAVY,True)
    for i,s in enumerate(["123 rue de la République","75001 Paris","France","contact@ox-invoice.fr","+33 1 23 45 67 89"]): txt(d,(200,1080+i*30),s,20,MUTED)
    txt(d,(650,1070),"FACTURÉ À" if lang=="fr" else "BILL TO",20,FAINT,True); txt(d,(650,1105),"Martin Dupont",27,NAVY,True); txt(d,(650,1148),"45 Avenue des Fleurs",20,MUTED); txt(d,(650,1178),"69000 Lyon, France",20,MUTED)
    d.line((200,1280,1040,1280),fill=LINE,width=2)
    txt(d,(215,1315),"DESCRIPTION",18,FAINT,True); txt(d,(650,1315),"QTÉ" if lang=="fr" else "QTY",18,FAINT,True); txt(d,(820,1315),"PRIX" if lang=="fr" else "RATE",18,FAINT,True); txt(d,(1015,1315),"TOTAL",18,FAINT,True,anchor="ra")
    lines=[("Développement site web" if lang=="fr" else "Website development","1","1 000,00 €","1 000,00 €"),("Maintenance mensuelle" if lang=="fr" else "Monthly maintenance","3","80,00 €","240,00 €"),("Formation" if lang=="fr" else "Training","1","300,00 €","300,00 €")]
    yy=1370
    for a,b,c,e in lines:
        txt(d,(215,yy),a,21,NAVY,True); txt(d,(665,yy),b,21,MUTED); txt(d,(825,yy),c,21,MUTED); txt(d,(1015,yy),e,21,NAVY,anchor="ra"); yy+=105
    d.line((200,1690,1040,1690),fill=LINE,width=2)
    txt(d,(690,1740),"Sous-total" if lang=="fr" else "Subtotal",22,MUTED); txt(d,(1015,1740),"1 540,00 €",22,NAVY,anchor="ra")
    txt(d,(690,1790),"TVA (20 %)" if lang=="fr" else "VAT (20%)",22,MUTED); txt(d,(1015,1790),"308,00 €",22,NAVY,anchor="ra")
    rr(d,(650,1835,1040,1915),18,BLUE_SOFT); txt(d,(680,1875),"Total TTC" if lang=="fr" else "Total",27,NAVY,True,anchor="lm"); txt(d,(1015,1875),"1 848,00 €",29,NAVY,True,anchor="rm")
    txt(d,(200,1960),"Merci pour votre confiance." if lang=="fr" else "Thank you for your business.",19,MUTED)
    return im

os.makedirs("shots/fr-FR",exist_ok=True); os.makedirs("shots/en-US",exist_ok=True)
funcs=[render_home,render_clients,render_services,render_documents,render_pdf]
for fn,name in zip(funcs,["1.jpg","2.jpg","3.jpg","4.jpg","5.jpg"]): fn("fr").save("shots/fr-FR/"+name,"JPEG",quality=95,subsampling=0)
for fn,name in zip(funcs,["1.jpg","2.jpg","3.jpg","4.jpg","5.jpg"]): fn("en").save("shots/en-US/"+name,"JPEG",quality=95,subsampling=0)
for folder in ["shots/fr-FR","shots/en-US"]:
    for f in sorted(os.listdir(folder)):
        p=os.path.join(folder,f); print(p,Image.open(p).size,os.path.getsize(p))
