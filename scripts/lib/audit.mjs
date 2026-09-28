import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const TEST_PUBLISHER = '3940256099942544';
const HARD = 'hard';
const WARNING = 'warning';
const INFO = 'info';

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readText(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }
function sha256(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

function imageInfo(p) {
  const b=fs.readFileSync(p);
  if (b.length>=24 && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return {kind:'png',width:b.readUInt32BE(16),height:b.readUInt32BE(20),alpha:[4,6].includes(b[25])};
  }
  if (b.length>=4 && b[0]===0xFF && b[1]===0xD8) {
    let i=2;
    while(i+9<b.length){
      if(b[i]!==0xFF){i++;continue}
      const marker=b[i+1]; i+=2;
      if(marker===0xD8||marker===0xD9) continue;
      if(i+2>b.length) break;
      const len=b.readUInt16BE(i); if(len<2||i+len>b.length) break;
      if([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF].includes(marker)) return {kind:'jpeg',height:b.readUInt16BE(i+3),width:b.readUInt16BE(i+5),alpha:false};
      i+=len;
    }
  }
  return null;
}

export function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['node_modules','.git','.factory-tools','artifacts','ios','android'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    ent.isDirectory() ? walk(p,out) : out.push(p);
  }
  return out;
}

export function auditApp(appRoot, opts={production:true}) {
  const findings = [];
  const add=(severity,id,message)=>findings.push({severity,id,message});
  const cfgPath=path.join(appRoot,'app.operatorx.json');
  if (!fs.existsSync(cfgPath)) {
    add(HARD,'APP_CONFIG_MISSING','app.operatorx.json missing');
    return findings;
  }
  let cfg;
  try { cfg=readJson(cfgPath); } catch(e) { add(HARD,'APP_CONFIG_INVALID',`app.operatorx.json invalid: ${e.message}`); return findings; }

  if (!/^com\.operatorx\.[a-z0-9][a-z0-9.-]*$/.test(cfg.bundleId||'')) add(HARD,'BUNDLE_INVALID',`Invalid OperatorX bundleId: ${cfg.bundleId||''}`);
  if (!/^\d+(\.\d+){1,2}$/.test(cfg.version||'')) add(HARD,'VERSION_INVALID','Version must be numeric semantic form (e.g. 1.0 or 1.0.0)');
  if (!Number.isInteger(Number(cfg.build)) || Number(cfg.build)<1) add(HARD,'BUILD_INVALID','Build must be integer >= 1');

  // UTF-8 BOM / JSON validation
  for (const f of walk(appRoot)) {
    const rel=path.relative(appRoot,f).replaceAll('\\','/');
    if (/\.(json|js|mjs|cjs|ts|tsx|yml|yaml|md)$/i.test(f)) {
      const b=fs.readFileSync(f);
      if (b.length>=3 && b[0]===0xEF && b[1]===0xBB && b[2]===0xBF) add(HARD,'UTF8_BOM',`${rel} has UTF-8 BOM`);
    }
    if (/\.json$/i.test(f)) {
      try { JSON.parse(fs.readFileSync(f,'utf8')); } catch(e) { add(HARD,'JSON_INVALID',`${rel}: ${e.message}`); }
    }
  }

  // Ensure forbidden EAS release commands are absent from workflow/release scripts.
  for (const rel of ['.github/workflows/ios-release.yml','scripts/ios/build_ios.sh','scripts/ios/upload_apple.sh','scripts/RELEASE.ps1']) {
    const t=readText(path.join(appRoot,rel));
    if (/\beas\s+(build|submit)\b/i.test(t)) add(HARD,'EAS_RELEASE_FORBIDDEN',`${rel} contains forbidden EAS release command`);
  }

  // AdMob / UMP / ATT production guard
  if (cfg.monetization?.admob) {
    const ids=cfg.admob||{};
    for (const k of ['iosAppId','bannerUnitId','interstitialUnitId']) {
      if (!ids[k]) add(HARD,'ADMOB_ID_MISSING',`AdMob ${k} missing`);
      if (String(ids[k]||'').includes(TEST_PUBLISHER) && !cfg.demo) add(HARD,'ADMOB_TEST_ID',`Google test identifier in production ${k}`);
    }
    const ads=readText(path.join(appRoot,'src/services/ads.ts'));
    const initFnStart=ads.indexOf('export async function initializeAds()');
    const initFnEnd=initFnStart>=0?ads.indexOf('\n}',initFnStart):-1;
    const initFn=initFnStart>=0?ads.slice(initFnStart,initFnEnd>=0?initFnEnd+2:undefined):'';
    const startFnStart=ads.indexOf('async function startMobileAdsIfAllowed()');
    const startFnEnd=startFnStart>=0?ads.indexOf('\n}',startFnStart):-1;
    const startFn=startFnStart>=0?ads.slice(startFnStart,startFnEnd>=0?startFnEnd+2:undefined):'';
    const gather=initFn.indexOf('await AdsConsent.gatherConsent()');
    const start=initFn.indexOf('await startMobileAdsIfAllowed()');
    const req=startFn.indexOf('await requestAttBeforeTracking()');
    const init=startFn.indexOf('await mobileAds().initialize()');
    if (!(gather>=0 && start>gather && req>=0 && init>req)) add(HARD,'ATT_ORDER','Expected UMP -> ATT gate -> Mobile Ads initialization');
    if (!ads.includes('AdsConsent.getPurposeConsents()')) add(HARD,'ATT_UMP_COORDINATION','UMP purpose consent check missing before ATT path');
    const testBannerGuard = ads.includes('USE_TEST_ADS ? TestIds.ADAPTIVE_BANNER') || ads.includes('__DEV__ ? TestIds.ADAPTIVE_BANNER');
    const testInterstitialGuard = ads.includes('USE_TEST_ADS ? TestIds.INTERSTITIAL') || ads.includes('__DEV__ ? TestIds.INTERSTITIAL');
    if (!(testBannerGuard && testInterstitialGuard)) add(HARD,'ADMOB_DEV_GUARD','Google TestIds must only be selected through a development/diagnostic guard');
    if (opts.production && !cfg.demo && (ids.forceTestAds===true || ids.testflightOnly===true)) add(HARD,'ADMOB_DIAGNOSTIC_BUILD','TestFlight diagnostic/test-ad flags must be disabled for production/App Review release');
    if (ids.forceTestAds===true && ids.testflightOnly!==true) add(HARD,'ADMOB_DIAGNOSTIC_MARKING','forceTestAds requires testflightOnly=true');
    if (!ads.includes('scheduleInterstitialRetry') || !ads.includes('waitForInterstitialReady')) add(WARNING,'ADMOB_INTERSTITIAL_RESILIENCE','Interstitial retry/wait-for-ready pattern missing; an eligible display event may be dropped');
    if (ids.rewardedUnitId && (!ads.includes('RewardedAdEventType.EARNED_REWARD') || !ads.includes('settleRewarded(rewardedEarned)'))) add(HARD,'ADMOB_REWARDED_EARNED_GATE','Rewarded benefit must only resolve true after EARNED_REWARD');
    const appConfig=readText(path.join(appRoot,'app.config.js'));
    if (!appConfig.includes('NSUserTrackingUsageDescription')) add(HARD,'ATT_PLIST','NSUserTrackingUsageDescription missing');
  }

  // Critical files
  for (const rel of ['package.json','app.config.js','assets/icon.png']) {
    if (!fs.existsSync(path.join(appRoot,rel))) add(HARD,'SOURCE_MISSING',`${rel} missing`);
  }
  const appConfigPath=path.join(appRoot,'app.config.js');
  if (fs.existsSync(appConfigPath)) {
    const syntax=spawnSync(process.execPath,['--check',appConfigPath],{encoding:'utf8'});
    if (syntax.status!==0) add(HARD,'APP_CONFIG_SYNTAX',`app.config.js syntax invalid: ${(syntax.stderr||syntax.stdout||'').trim().split('\n').slice(-2).join(' ')}`);
  }
  if (!fs.existsSync(path.join(appRoot,'package-lock.json'))) add(WARNING,'PACKAGE_LOCK_MISSING','package-lock.json missing; run PREFLIGHT/npm install before GitHub build');
  const packageJson=readText(path.join(appRoot,'package.json'));
  if (!packageJson.includes('\"typecheck\"')) add(HARD,'TYPECHECK_SCRIPT_MISSING','package.json typecheck script missing');
  try {
    const pkg=JSON.parse(packageJson);
    const all={...(pkg.dependencies||{}),...(pkg.devDependencies||{})};
    for (const dep of ['expo','react','react-native','typescript','expo-build-properties']) if(!all[dep]) add(HARD,'DEPENDENCY_DECLARATION_MISSING',`${dep} missing from package.json`);
    if(cfg.monetization?.admob){
      for (const dep of ['react-native-google-mobile-ads','expo-tracking-transparency']) if(!all[dep]) add(HARD,'DEPENDENCY_DECLARATION_MISSING',`${dep} missing for AdMob/ATT`);
    }
  } catch(e) { add(HARD,'PACKAGE_JSON_INVALID',e.message); }

  // Frozen source identity / asset check
  const manifestPath=path.join(appRoot,'release','SOURCE_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const man=readJson(manifestPath);
      if (man.identity?.bundleId!==cfg.bundleId || man.identity?.version!==cfg.version || Number(man.identity?.build)!==Number(cfg.build)) {
        add(HARD,'SOURCE_IDENTITY_DRIFT','SOURCE_MANIFEST identity does not match app.operatorx.json');
      }
      for (const e of man.files||[]) {
        const p=path.join(appRoot,e.path);
        if (!fs.existsSync(p)) add(HARD,'SOURCE_MANIFEST_MISSING',`Frozen source missing: ${e.path}`);
        else if (sha256(p)!==e.sha256) add(HARD,'SOURCE_MANIFEST_DRIFT',`Frozen source changed: ${e.path}`);
      }
    } catch(e) { add(HARD,'SOURCE_MANIFEST_INVALID',e.message); }
  } else {
    add(WARNING,'SOURCE_NOT_FROZEN','release/SOURCE_MANIFEST.json not created yet');
  }

  // Template icon must not ship as a real product.
  const icon=path.join(appRoot,'assets','icon.png');
  const templateHashFile=path.join(appRoot,'.operatorx','template-icon.sha256');
  if (fs.existsSync(icon) && fs.existsSync(templateHashFile) && !cfg.demo) {
    const known=readText(templateHashFile).trim();
    if (known && sha256(icon)===known) add(HARD,'OLD_ICON','Template icon still present; replace before production release');
  }

  // Secret scan
  for (const f of walk(appRoot)) {
    const rel=path.relative(appRoot,f).replaceAll('\\','/');
    if (/\.(png|jpe?g|zip|ipa|xcarchive)$/i.test(f)) continue;
    const t=readText(f);
    if (/-----BEGIN (?:EC |RSA )?PRIVATE KEY-----/.test(t)) add(HARD,'SECRET_PRIVATE_KEY',`Private key material in ${rel}`);
    if (/APPLE_CERTIFICATE_PASSWORD\s*=\s*["'][^"']+/.test(t)) add(HARD,'SECRET_PASSWORD',`Certificate password committed in ${rel}`);
    if (/ASC_API_KEY_BASE64\s*=\s*["'][A-Za-z0-9+/=]{40,}/.test(t)) add(HARD,'SECRET_ASC_KEY',`ASC key material committed in ${rel}`);
  }

  // Warnings only
  const privacy=path.join(appRoot,'apple','APPLE_APP_PRIVACY_CHECKLIST.md');
  if (!fs.existsSync(privacy)) add(WARNING,'APP_PRIVACY_MISSING','App Privacy checklist missing (manual App Store step)');
  const screenshots=path.join(appRoot,'apple','screenshots');
  let shotFiles=[];
  if (fs.existsSync(screenshots)) shotFiles=walk(screenshots,[]).filter(x=>/\.(png|jpe?g)$/i.test(x));
  if (shotFiles.length===0) add(WARNING,'SCREENSHOTS_MISSING','App Store screenshots missing');
  else {
    let defaults={}; try { defaults=readJson(path.join(appRoot,'.operatorx','defaults.json')); } catch {}
    const spec=defaults?.appStore?.screenshotSpecs||{};
    const iph=new Set((spec.iphoneAccepted||[]).map(x=>x.join('x'))), ipd=new Set((spec.ipadRequiredAccepted||[]).map(x=>x.join('x')));
    let iphoneCount=0,ipadCount=0;
    for(const f of shotFiles){
      const info=imageInfo(f), rel=path.relative(appRoot,f).replaceAll('\\','/');
      if(!info){ add(WARNING,'SCREENSHOT_FORMAT',`${rel}: unreadable/unsupported image`); continue; }
      const key=`${info.width}x${info.height}`;
      if(iph.has(key)) iphoneCount++; else if(ipd.has(key)) ipadCount++; else add(WARNING,'SCREENSHOT_DIMENSION',`${rel}: ${key} is not an accepted configured App Store size`);
      if(info.alpha && spec.noAlpha!==false) add(WARNING,'SCREENSHOT_ALPHA',`${rel}: PNG contains alpha channel`);
    }
    if(cfg.apple?.iphone!==false && iphoneCount===0) add(WARNING,'SCREENSHOT_IPHONE_MISSING','No accepted iPhone screenshot detected');
    if(cfg.apple?.ipad===true && ipadCount===0) add(WARNING,'SCREENSHOT_IPAD_MISSING','No accepted iPad screenshot detected');
  }
  const review=readText(path.join(appRoot,'apple','review','REVIEW_NOTES.md'));
  if(!review.trim() || /TODO_REVIEW|À compléter|TODO/i.test(review)) add(WARNING,'REVIEW_NOTES_INCOMPLETE','Review Notes require a complete reviewer-visible feature walkthrough');
  const fr=path.join(appRoot,'apple','metadata','fr-FR','description.txt');
  const en=path.join(appRoot,'apple','metadata','en-US','description.txt');
  if (!readText(fr).trim() || !readText(en).trim()) add(WARNING,'MARKETING_MISSING','FR/en-US descriptions incomplete');

  return findings;
}

export function summarize(findings) {
  const hard=findings.filter(x=>x.severity===HARD).length;
  const warnings=findings.filter(x=>x.severity===WARNING).length;
  return {hard,warnings,eligible:hard===0};
}

export function formatReport(findings) {
  const s=summarize(findings);
  const lines=findings.map(f=>`${f.severity==='hard'?'FAIL':f.severity==='warning'?'WARN':'INFO'} [${f.id}] ${f.message}`);
  lines.push('',`HARD FAILURES: ${s.hard}`,`WARNINGS: ${s.warnings}`,`BUILD ELIGIBLE: ${s.eligible?'YES':'NO'}`);
  return lines.join('\n');
}
