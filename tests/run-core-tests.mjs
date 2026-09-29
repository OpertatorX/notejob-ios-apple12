#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require=createRequire(import.meta.url);
const out = path.join(root, '.qa-build');
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out, {recursive:true});
// Invoke the project's local TypeScript compiler through Node itself. This is
// intentionally cross-platform: spawning `npx.cmd` directly can fail on some
// Windows/PowerShell setups even when `npm run typecheck` works correctly.
const localTsc = require.resolve('typescript/bin/tsc');
const tsVersion = require('typescript/package.json').version;
const tsMajor = Number.parseInt(tsVersion.split('.')[0] ?? '0', 10);
// TypeScript 6+ refuses command-line file inputs when a tsconfig.json is present
// unless --ignoreConfig is explicit (TS5112). We intentionally compile only the
// pure core modules here, so ignoring the app tsconfig for this isolated test
// compile is correct. Keep compatibility with TypeScript 5 by adding the new
// flag only when the installed compiler supports it.
const ts6Compat = tsMajor >= 6 ? ['--ignoreConfig','--ignoreDeprecations','6.0'] : [];
const compilerArgs = [...ts6Compat,'--target','ES2022','--module','CommonJS','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,
  path.join(root,'src','types.ts'),path.join(root,'src','domain.ts'),path.join(root,'src','pdfTemplate.ts')];
const compile=spawnSync(process.execPath,[localTsc, ...compilerArgs],{stdio:'inherit',cwd:root});
if(compile.error){
  console.error('Core TypeScript compiler could not start:', compile.error.message);
  process.exit(1);
}
if(compile.status!==0){console.error(`Core TypeScript compile failed (${compile.status ?? 'unknown'})`);process.exit(1);}
const domain=require(path.join(out,'domain.js'));
const pdf=require(path.join(out,'pdfTemplate.js'));
let passed=0;
function test(name,fn){try{fn();console.log(`PASS ${name}`);passed++;}catch(e){console.error(`FAIL ${name}:`,e?.message||e);process.exitCode=1;}}
function eq(actual,expected,msg=''){if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);}
function ok(value,msg='assertion failed'){if(!value)throw new Error(msg);}

const fresh=domain.initialData();
test('new account is empty and zeroed',()=>{eq(fresh.documents,[]);eq(fresh.clients,[]);eq(fresh.services,[]);eq(fresh.freeDocumentsCreated,0);eq(fresh.business.defaultTaxPct,0);eq(fresh.counters,{estimate:1,invoice:1});});
test('app language follows device region',()=>{eq(domain.detectDeviceLanguage('fr-FR'),'fr');eq(domain.detectDeviceLanguage('en-US'),'en');eq(domain.detectDeviceLanguage('fr-CA'),'en');eq(domain.detectDeviceLanguage('fr'),'fr');eq(domain.detectDeviceLanguage('de-DE'),'en');});
test('free document gate is exactly three',()=>{ok(domain.canCreateDocument({...fresh,freeDocumentsCreated:0}));ok(domain.canCreateDocument({...fresh,freeDocumentsCreated:2}));ok(!domain.canCreateDocument({...fresh,freeDocumentsCreated:3}));ok(domain.canCreateDocument({...fresh,freeDocumentsCreated:99,proEntitled:true}));});
test('deleting business data cannot reset trial or Pro access',()=>{const reset=domain.resetBusinessData({...fresh,freeDocumentsCreated:3,proEntitled:true,entitlementCheckedAt:'2026-09-25T00:00:00.000Z'});eq(reset.documents,[]);eq(reset.clients,[]);eq(reset.services,[]);eq(reset.business.name,'');eq(reset.freeDocumentsCreated,3);eq(reset.proEntitled,true);eq(reset.entitlementCheckedAt,'2026-09-25T00:00:00.000Z');});
const sample={id:'d',kind:'invoice',number:'INV-0001',clientId:null,client:{name:'Client & Co',email:'a@b.com',phone:'',address:'Paris'},items:[{id:'1',title:'Design <Pack>',details:'Line 1\nLine 2',quantity:2,rate:100},{id:'2',title:'Setup',details:'',quantity:1,rate:50}],discountPct:10,taxPct:20,depositPct:25,issueDate:'2026-09-24',dueDate:'2026-10-24',notes:'Thanks <script>alert(1)</script>',status:'sent',createdAt:'x',updatedAt:'x'};
test('financial totals are deterministic',()=>{eq(domain.calculateTotals(sample),{subtotal:250,discount:25,afterDiscount:225,tax:45,total:270,deposit:67.5,balance:202.5});});
test('document numbers never reuse a lower sequence',()=>{eq(domain.nextDocumentNumber('invoice',[sample],7),'INV-0007');eq(domain.nextDocumentNumber('estimate',[],3),'EST-0003');});
test('overdue is derived only for sent invoices',()=>{eq(domain.effectiveStatus({...sample,dueDate:'2026-01-01',status:'sent'},'2026-09-24'),'overdue');eq(domain.effectiveStatus({...sample,dueDate:'2026-01-01',status:'draft'},'2026-09-24'),'draft');eq(domain.effectiveStatus({...sample,kind:'estimate',dueDate:'2026-01-01',status:'sent'},'2026-09-24'),'sent');});
const business={...fresh.business,name:'OperatorX Studio',email:'hello@example.com',address:'1 Main Street',paymentDetails:'IBAN FR76 TEST',currency:'EUR',language:'en',pdfTemplate:'classic',defaultTaxPct:0};
test('PDF HTML is A4, escaped and has robust pagination rules',()=>{const html=pdf.buildDocumentHtml(business,sample,'en');ok(html.includes('@page { size: A4; margin: 16mm 17mm 16mm; }'));ok(html.includes('page-break-inside:avoid'));ok(html.includes('Client &amp; Co'));ok(html.includes('Design &lt;Pack&gt;'));ok(!html.includes('<script>alert(1)</script>'));ok(html.includes('€270.00')||html.includes('€270'));ok(html.includes('IBAN FR76 TEST'));ok(html.includes('Payment'));ok(!html.includes('Made with'));});
test('all three PDF templates render distinct classes',()=>{for(const style of ['classic','modern','minimal']){const html=pdf.buildDocumentHtml({...business,pdfTemplate:style},sample,'en');ok(html.includes(`template-${style}`),`missing ${style}`);}});
test('estimate uses validity label',()=>{const html=pdf.buildDocumentHtml(business,{...sample,kind:'estimate',number:'EST-0001'},'en');ok(html.includes('Valid until'));});
test('schema migration infers counters and reusable services without sample data',()=>{const migrated=domain.sanitizeLoadedData({schemaVersion:1,business:{name:'X'},documents:[sample],clients:[],freeDocumentsCreated:1});eq(migrated.counters.invoice,2);eq(migrated.counters.estimate,1);eq(migrated.business.name,'X');ok(migrated.services.length>=2);});

fs.rmSync(out,{recursive:true,force:true});
if(process.exitCode){process.exit(process.exitCode)}
console.log(`\n${passed}/${passed} core tests PASS`);
