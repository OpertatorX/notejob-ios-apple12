#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.cwd());
const prod=process.argv.includes('--production');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const cfg=JSON.parse(fs.readFileSync(path.join(root,'app.operatorx.json'),'utf8'));
const checks=[];
function add(name,ok,detail=''){checks.push({name,ok,detail});}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function exists(rel){return fs.existsSync(path.join(root,rel));}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
const deps={...(pkg.dependencies||{}),...(pkg.devDependencies||{})};
add('Bundle ID',cfg.bundleId==='com.operatorx.oxinvoice',cfg.bundleId);
add('No advertising monetization',cfg.monetization?.admob===false && !deps['react-native-google-mobile-ads'],'AdMob must stay absent');
add('IAP enabled',cfg.monetization?.iap===true && Boolean(deps['expo-iap']));
add('Professional PDF filenames',Boolean(deps['expo-file-system']) && read('src/pdf.ts').includes('safePdfName') && read('src/pdf.ts').includes('Paths.cache'));
const purchase=read('src/purchases.tsx');
add('Authoritative current entitlement restore',purchase.includes('onlyIncludeActiveItemsIOS: true') && purchase.includes("state === 'entitled'"));
for(const id of ['com.operatorx.oxinvoice.pro.6months','com.operatorx.oxinvoice.pro.yearly']) add(`IAP product ${id}`,purchase.includes(id));
const appSource=read('App.tsx');
add('Business setup gate before first document',appSource.includes('business.name.trim()') && appSource.includes("type: 'business'"));
const domain=read('src/domain.ts');
add('New account has no sample data',domain.includes('documents: []')&&domain.includes('clients: []')&&domain.includes('services: []'));
add('Reusable service catalog',exists('src/screens/ServicesScreen.tsx')&&appSource.includes("case 'services'"));
add('New account dashboard numbers start at zero',domain.includes('freeDocumentsCreated: 0')&&domain.includes('defaultTaxPct: 0'));
const pdf=read('src/pdfTemplate.ts');
add('A4 PDF renderer',pdf.includes('@page { size: A4; margin: 16mm 17mm 16mm; }'));
add('PDF pagination protection',pdf.includes('page-break-inside:avoid'));
add('PDF input escaping',pdf.includes("replaceAll('&', '&amp;')"));
add('PDF templates Classic/Modern/Minimal',pdf.includes('template-${business.pdfTemplate}')&&pdf.includes('.template-modern')&&pdf.includes('.template-minimal'));
add('PDF has payment instructions and no app watermark',pdf.includes('business.paymentDetails')&&!pdf.includes('Made with OX Invoice'));
add('Local SQLite storage',deps['expo-sqlite']&&read('src/storage.ts').includes("expo-sqlite/kv-store"));
add('No analytics SDK',!Object.keys(deps).some(x=>/analytics|firebase|amplitude|segment|sentry/i.test(x)));
add('Review notes complete',!read('apple/review/REVIEW_NOTES.md').match(/TODO_REVIEW|TODO|À compléter/));
for(const locale of ['en-US','fr-FR']) for(const f of ['name','subtitle','keywords','description','promotional_text','support_url','marketing_url']) add(`${locale} ${f}`,exists(`apple/metadata/${locale}/${f}.txt`)&&read(`apple/metadata/${locale}/${f}.txt`).trim().length>0);
for(const rel of ['site/index.html','site/en-US/privacy.html','site/en-US/terms.html','site/en-US/support.html','site/fr-FR/privacy.html','site/fr-FR/terms.html','site/fr-FR/support.html']) add(rel,exists(rel)&&read(rel).length>300);
const icon=path.join(root,'assets','icon.png');
const templateHashPath=path.join(root,'.operatorx','template-icon.sha256');
const templateHash=exists('.operatorx/template-icon.sha256')?read('.operatorx/template-icon.sha256').trim().split(/\s+/)[0]:'';
add('Custom app icon',exists('assets/icon.png') && fs.statSync(icon).size > 50000 && (!templateHash || sha(icon)!==templateHash));
const key=process.env.EXPO_PUBLIC_IAPKIT_API_KEY||'';
add('IAPKit publishable key format',!prod || key.startsWith('openiap-kit_pk_'),prod?'required for production build':'checked at production build');
const failures=checks.filter(c=>!c.ok);
for(const c of checks) console.log(`${c.ok?'PASS':'FAIL'} ${c.name}${c.detail?` - ${c.detail}`:''}`);
console.log(`\n${checks.length-failures.length}/${checks.length} OX Invoice checks PASS`);
if(failures.length) process.exit(1);
