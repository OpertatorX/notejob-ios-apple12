from PIL import Image, ImageDraw, ImageFont
import os, textwrap

W,H=2064,2752
BG="#F6F7F8"; NAVY="#0A2540"; MUTED="#667085"; FAINT="#98A2B3"
LINE="#E6E8EC"; WHITE="#FFFFFF"; BLUE="#276EF1"; GREEN="#16875D"
RED="#D92D20"; AMBER="#B54708"; SOFT="#F0F3F6"; BLUE_SOFT="#EAF2FF"; GREEN_SOFT="#E8F6F0"
font_reg="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def F(size,bold=False): return ImageFont.truetype(font_bold if bold else font_reg,size)
def rr(d,xy,r,fill,outline=None,width=1): d.rounded_rectangle(xy,radius=r,fill=fill,outline=outline,width=width)
def txt(d,xy,s,size,fill=NAVY,bold=False,anchor=None,align="left"): d.text(xy,s,font=F(size,bold),fill=fill,anchor=anchor,align=align)
def fit_center(d,s,y,maxw,size,fill=NAVY,bold=True):
    while size>34 and d.textbbox((0,0),s,font=F(size,bold))[2]>maxw: size-=2
    txt(d,(W//2,y),s,size,fill,bold,anchor="ma")

def base(title,subtitle):
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.ellipse((-260,-260,520,520),fill="#E5F0FF")
    d.ellipse((1560,-80,2320,680),fill="#EAF2FF")
    d.ellipse((1580,2080,2320,2820),fill="#E4EEFF")
    fit_center(d,title,90,1840,96,NAVY,True)
    yy=220
    for line in textwrap.wrap(subtitle,width=58):
        fit_center(d,line,yy,1780,48,MUTED,False); yy+=64

    # iPad device shell
    rr(d,(155,410,1909,2640),72,"#0B0B0C")
    rr(d,(178,433,1886,2617),56,WHITE)
    txt(d,(245,475),"10:38",33,"#000",True)
    txt(d,(1645,475),"Wi‑Fi",24,"#000",True)
    rr(d,(1745,454,1830,490),10,"#FFFFFF",outline="#667085",width=2)
    d.rectangle((1753,461,1767,483),fill="#22C55E")
    return im,d

def nav(d,active,lang):
    labels=(["Accueil","Clients","Prestations","Documents","Plus"] if lang=="fr" else ["Home","Clients","Services","Documents","More"])
    x0,y0,x1,y1=250,2385,1815,2545
    rr(d,(x0,y0,x1,y1),28,WHITE,outline=LINE,width=2)
    step=(x1-x0)//5
    for i,l in enumerate(labels):
        cx=x0+step*i+step//2
        fill=NAVY if i==active else FAINT
        txt(d,(cx,y0+36),["⌂","◉","◆","▤","•••"][i],30,fill,True,anchor="ma")
        txt(d,(cx,y0+100),l,20,fill,True,anchor="ma")

def docrow(d,y,initial,name,meta,amount,status,status_color):
    rr(d,(305,y,1758,y+160),0,WHITE)
    rr(d,(330,y+28,405,y+103),20,BLUE_SOFT)
    txt(d,(368,y+66),initial,24,BLUE,True,anchor="mm")
    txt(d,(455,y+28),name,29,NAVY,True)
    txt(d,(455,y+76),meta,22,MUTED)
    txt(d,(1690,y+30),amount,28,NAVY,True,anchor="ra")
    pillfill=GREEN_SOFT if status_color==GREEN else BLUE_SOFT if status_color==BLUE else SOFT
    rr(d,(1495,y+88,1698,y+132),22,pillfill)
    txt(d,(1596,y+109),status,19,status_color,True,anchor="mm")
    d.line((305,y+159,1758,y+159),fill=LINE,width=2)

def render_home(lang):
    im,d=base("Pilotez votre activité" if lang=="fr" else "Run your business",
              "Devis, factures et indicateurs clés dans une interface claire sur iPad." if lang=="fr" else "Quotes, invoices, and key metrics in one clear iPad workspace.")
    txt(d,(300,565),"OX INVOICE",24,FAINT,True)
    txt(d,(300,610),"Bonjour" if lang=="fr" else "Hello",58,NAVY,True)
    txt(d,(300,685),"Votre activité en un coup d’œil." if lang=="fr" else "See your activity at a glance.",31,MUTED)
    metrics=[("2 450,00 €","À recevoir" if lang=="fr" else "Unpaid",AMBER),("5 320,00 €","Payé" if lang=="fr" else "Paid",GREEN),("780,00 €","En retard" if lang=="fr" else "Overdue",RED),("3","En attente" if lang=="fr" else "Pending",BLUE)]
    for idx,(v,l,c) in enumerate(metrics):
        col=idx%4; x=300+col*360; y=790
        rr(d,(x,y,x+320,y+160),22,WHITE,outline=LINE,width=2)
        txt(d,(x+26,y+34),v,31,c,True); txt(d,(x+26,y+99),l,22,MUTED,True)
    rr(d,(300,1010,700,1115),20,NAVY); rr(d,(730,1010,1145,1115),20,WHITE,outline="#D0D5DD",width=2)
    txt(d,(500,1062),"+ "+("Nouveau devis" if lang=="fr" else "New quote"),25,WHITE,True,anchor="mm")
    txt(d,(938,1062),"+ "+("Nouvelle facture" if lang=="fr" else "New invoice"),24,NAVY,True,anchor="mm")
    txt(d,(300,1210),"Documents récents" if lang=="fr" else "Recent documents",38,NAVY,True)
    txt(d,(1758,1210),"Tout voir" if lang=="fr" else "See all",24,BLUE,True,anchor="ra")
    rr(d,(300,1270,1758,1895),28,WHITE,outline=LINE,width=2)
    vals=[("B","Boulangerie Martin" if lang=="fr" else "Martin Bakery","FAC-2026-0004 · 2026-10-02","1 250,00 €","Payée" if lang=="fr" else "Paid",GREEN),("D","Dupont Conseil" if lang=="fr" else "Dupont Consulting","DEV-2026-0003 · 2026-10-01","980,00 €","Envoyé" if lang=="fr" else "Sent",BLUE),("L","Leclerc & Fils" if lang=="fr" else "Leclerc & Sons","EST-2026-0002 · 2026-09-28","0,00 €","Brouillon" if lang=="fr" else "Draft",MUTED)]
    y=1305
    for v in vals: docrow(d,y,*v); y+=190
    nav(d,0,lang); return im

def render_clients(lang):
    im,d=base("Gérez vos clients" if lang=="fr" else "Manage your clients",
              "Vos contacts, leurs informations et leur historique sont immédiatement accessibles." if lang=="fr" else "Contacts, details, and history are instantly accessible.")
    txt(d,(300,610),"Clients",58,NAVY,True)
    rr(d,(300,720,1758,815),22,WHITE,outline=LINE,width=2)
    txt(d,(350,753),"Rechercher un client…" if lang=="fr" else "Search a client…",27,FAINT)
    rr(d,(300,855,1758,1745),28,WHITE,outline=LINE,width=2)
    people=[("LD","Legrand Design","contact@legrand-design.fr","12 doc." if lang=="fr" else "12 docs."),("BM","Boulangerie Martin" if lang=="fr" else "Martin Bakery","contact@martin-bakery.fr","8 doc." if lang=="fr" else "8 docs."),("PC","Petit Commerce" if lang=="fr" else "Small Business Co.","info@petit-commerce.fr","3 doc." if lang=="fr" else "3 docs."),("SH","Studio Horizon" if lang=="fr" else "Horizon Studio","hello@studio-horizon.fr","6 doc." if lang=="fr" else "6 docs."),("AL","Atelier Lumière" if lang=="fr" else "Lumiere Studio","contact@atelier-lumiere.fr","4 doc." if lang=="fr" else "4 docs.")]
    y=890
    for ini,n,m,c in people:
        rr(d,(335,y+8,415,y+88),20,SOFT); txt(d,(375,y+49),ini,23,NAVY,True,anchor="mm")
        txt(d,(455,y+8),n,29,NAVY,True); txt(d,(455,y+56),m,22,MUTED)
        txt(d,(1690,y+30),c,22,MUTED,True,anchor="ra")
        d.line((300,y+130,1758,y+130),fill=LINE,width=2); y+=160
    nav(d,1,lang); return im

def render_services(lang):
    im,d=base("Réutilisez vos prestations" if lang=="fr" else "Reuse your services",
              "Enregistrez vos services et tarifs pour créer vos documents plus vite." if lang=="fr" else "Save your services and rates to create documents faster.")
    txt(d,(300,610),"Prestations" if lang=="fr" else "Services",58,NAVY,True)
    rr(d,(300,720,1758,815),22,WHITE,outline=LINE,width=2)
    txt(d,(350,753),"Rechercher une prestation…" if lang=="fr" else "Search a service…",27,FAINT)
    rr(d,(300,855,1758,1705),28,WHITE,outline=LINE,width=2)
    items=[("Création de site web" if lang=="fr" else "Website creation","Site vitrine sur mesure" if lang=="fr" else "Custom showcase site","1 250,00 €"),("Identité visuelle" if lang=="fr" else "Brand identity","Logo et charte graphique" if lang=="fr" else "Logo and brand guidelines","750,00 €"),("Maintenance mensuelle" if lang=="fr" else "Monthly maintenance","Mises à jour et support" if lang=="fr" else "Updates and support","120,00 €"),("Conseil et audit" if lang=="fr" else "Consulting and audit","Analyse et recommandations" if lang=="fr" else "Analysis and recommendations","350,00 €"),("Formation" if lang=="fr" else "Training","Session personnalisée" if lang=="fr" else "Custom session","300,00 €")]
    y=890
    for n,m,a in items:
        rr(d,(335,y+8,415,y+88),20,BLUE_SOFT); txt(d,(375,y+49),"S",24,BLUE,True,anchor="mm")
        txt(d,(455,y+8),n,28,NAVY,True); txt(d,(455,y+56),m,21,MUTED)
        txt(d,(1690,y+30),a,26,NAVY,True,anchor="ra")
        d.line((300,y+130,1758,y+130),fill=LINE,width=2); y+=160
    nav(d,2,lang); return im

def render_documents(lang):
    im,d=base("Suivez vos documents" if lang=="fr" else "Track your documents",
              "Filtrez, recherchez et suivez l’état de chaque devis ou facture." if lang=="fr" else "Filter, search, and track every quote or invoice.")
    txt(d,(300,590),"Documents",58,NAVY,True)
    rr(d,(1628,565,1758,695),30,NAVY); txt(d,(1693,629),"+",52,WHITE,True,anchor="mm")
    rr(d,(300,735,1758,825),22,SOFT)
    labels=["Tous","Devis","Factures"] if lang=="fr" else ["All","Quotes","Invoices"]
    seg=(1758-300)//3
    for i,l in enumerate(labels):
        x=300+i*seg; fill=NAVY if i==0 else SOFT
        rr(d,(x,735,x+seg,825),22,fill); txt(d,(x+seg//2,780),l,24,WHITE if i==0 else MUTED,True,anchor="mm")
    rr(d,(300,855,1758,950),22,WHITE,outline=LINE,width=2)
    txt(d,(350,888),"Rechercher un document…" if lang=="fr" else "Search a document…",27,FAINT)
    rr(d,(300,985,1758,2040),28,WHITE,outline=LINE,width=2)
    items=[("F","Facture rénovation" if lang=="fr" else "Renovation invoice","FAC-2026-012 · 2026-10-15","1 250,00 €","Payée" if lang=="fr" else "Paid",GREEN),("D","Devis site web" if lang=="fr" else "Website quote","DEV-2026-008 · 2026-10-10","950,00 €","Envoyée" if lang=="fr" else "Sent",BLUE),("F","Facture maintenance" if lang=="fr" else "Maintenance invoice","FAC-2026-007 · 2026-10-04","320,00 €","Brouillon" if lang=="fr" else "Draft",MUTED),("D","Devis conseil" if lang=="fr" else "Consulting quote","DEV-2026-006 · 2026-09-28","480,00 €","Accepté" if lang=="fr" else "Approved",GREEN),("F","Facture formation" if lang=="fr" else "Training invoice","FAC-2026-005 · 2026-09-20","780,00 €","Payée" if lang=="fr" else "Paid",GREEN)]
    y=1015
    for v in items: docrow(d,y,*v); y+=195
    nav(d,3,lang); return im

def render_pdf(lang):
    im,d=base("Des PDF vraiment professionnels" if lang=="fr" else "Professional PDFs, ready to send",
              "Prévisualisez et partagez des factures propres depuis votre iPad." if lang=="fr" else "Preview and share polished invoices directly from your iPad.")
    txt(d,(300,570),"‹",58,NAVY); txt(d,(320,635),"Aperçu" if lang=="fr" else "Preview",58,NAVY,True)
    rr(d,(300,735,720,830),20,WHITE,outline="#D0D5DD",width=2)
    txt(d,(510,783),"Modifier" if lang=="fr" else "Edit",25,NAVY,True,anchor="mm")
    rr(d,(760,735,1265,830),20,NAVY)
    txt(d,(1012,783),"Partager le PDF" if lang=="fr" else "Share PDF",25,WHITE,True,anchor="mm")

    rr(d,(300,895,1758,2160),24,WHITE,outline=LINE,width=2)
    txt(d,(355,950),"OX INVOICE",32,NAVY,True)
    txt(d,(1685,950),"FACTURE" if lang=="fr" else "INVOICE",34,NAVY,True,anchor="ra")
    txt(d,(1685,997),"#FAC-2026-012",21,MUTED,True,anchor="ra")
    txt(d,(355,1035),"OX Solutions",27,NAVY,True)
    for i,s in enumerate(["123 rue de la République","75001 Paris","France","contact@ox-invoice.fr","+33 1 23 45 67 89"]):
        txt(d,(355,1080+i*30),s,20,MUTED)
    txt(d,(1080,1060),"FACTURÉ À" if lang=="fr" else "BILL TO",20,FAINT,True)
    txt(d,(1080,1100),"Martin Dupont",27,NAVY,True)
    txt(d,(1080,1145),"45 Avenue des Fleurs",20,MUTED); txt(d,(1080,1175),"69000 Lyon, France",20,MUTED)
    d.line((355,1290,1700,1290),fill=LINE,width=2)
    txt(d,(370,1325),"DESCRIPTION",18,FAINT,True); txt(d,(1080,1325),"QTÉ" if lang=="fr" else "QTY",18,FAINT,True)
    txt(d,(1350,1325),"PRIX" if lang=="fr" else "RATE",18,FAINT,True); txt(d,(1685,1325),"TOTAL",18,FAINT,True,anchor="ra")
    lines=[("Développement site web" if lang=="fr" else "Website development","1","1 000,00 €","1 000,00 €"),("Maintenance mensuelle" if lang=="fr" else "Monthly maintenance","3","80,00 €","240,00 €"),("Formation" if lang=="fr" else "Training","1","300,00 €","300,00 €")]
    yy=1385
    for a,b,c,e in lines:
        txt(d,(370,yy),a,21,NAVY,True); txt(d,(1100,yy),b,21,MUTED); txt(d,(1360,yy),c,21,MUTED); txt(d,(1685,yy),e,21,NAVY,anchor="ra"); yy+=105
    d.line((355,1710,1700,1710),fill=LINE,width=2)
    txt(d,(1220,1770),"Sous-total" if lang=="fr" else "Subtotal",22,MUTED); txt(d,(1685,1770),"1 540,00 €",22,NAVY,anchor="ra")
    txt(d,(1220,1825),"TVA (20 %)" if lang=="fr" else "VAT (20%)",22,MUTED); txt(d,(1685,1825),"308,00 €",22,NAVY,anchor="ra")
    rr(d,(1180,1880,1700,1970),18,BLUE_SOFT)
    txt(d,(1210,1925),"Total TTC" if lang=="fr" else "Total",27,NAVY,True,anchor="lm")
    txt(d,(1680,1925),"1 848,00 €",29,NAVY,True,anchor="rm")
    txt(d,(355,2070),"Merci pour votre confiance." if lang=="fr" else "Thank you for your business.",19,MUTED)
    return im

os.makedirs("shots-ipad/fr-FR",exist_ok=True)
os.makedirs("shots-ipad/en-US",exist_ok=True)
funcs=[render_home,render_clients,render_services,render_documents,render_pdf]
for fn,name in zip(funcs,["1.jpg","2.jpg","3.jpg","4.jpg","5.jpg"]):
    fn("fr").save("shots-ipad/fr-FR/"+name,"JPEG",quality=95,subsampling=0)
for fn,name in zip(funcs,["1.jpg","2.jpg","3.jpg","4.jpg","5.jpg"]):
    fn("en").save("shots-ipad/en-US/"+name,"JPEG",quality=95,subsampling=0)

for folder in ["shots-ipad/fr-FR","shots-ipad/en-US"]:
    for f in sorted(os.listdir(folder)):
        p=os.path.join(folder,f)
        print(p,Image.open(p).size,os.path.getsize(p))
