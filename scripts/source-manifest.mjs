#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const appRoot=path.resolve(process.argv[2]||process.cwd());
const mode=process.argv.includes('--verify')?'verify':'write';
const cfg=JSON.parse(fs.readFileSync(path.join(appRoot,'app.operatorx.json'),'utf8'));
const critical=[
  'app.operatorx.json','app.config.js','package.json','package-lock.json','App.tsx',
  'src/services/ads.ts','src/config/admob.ts','src/components/AdSlot.tsx','assets/icon.png',
  '.github/workflows/ios-release.yml','scripts/ios/build_ios.sh','scripts/ios/sign_ios.sh','scripts/ios/upload_apple.sh',
  'scripts/ios/asc-build-check.mjs','scripts/ios/asc-metadata-snapshot.mjs','scripts/ios/sync_metadata.sh','scripts/ios/sync_screenshots.sh',
  'scripts/RELEASE.ps1','apple/review/REVIEW_NOTES.md'
].filter(rel=>fs.existsSync(path.join(appRoot,rel)));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  identity:{name:cfg.name,bundleId:cfg.bundleId,version:cfg.version,build:Number(cfg.build)},
  files:critical.map(rel=>({path:rel,sha256:sha(path.join(appRoot,rel))}))
};
const out=path.join(appRoot,'release','SOURCE_MANIFEST.json');
if(mode==='write'){
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n','utf8');
  console.log(`SOURCE_MANIFEST written: ${out}`);
}else{
  if(!fs.existsSync(out)) throw new Error('SOURCE_MANIFEST.json missing');
  const old=JSON.parse(fs.readFileSync(out,'utf8'));
  const oldPaths=(old.files||[]).map(e=>e.path).sort();
  const newPaths=manifest.files.map(e=>e.path).sort();
  const same=JSON.stringify(old.identity)===JSON.stringify(manifest.identity) &&
    JSON.stringify(oldPaths)===JSON.stringify(newPaths) &&
    old.files?.every(e=>fs.existsSync(path.join(appRoot,e.path)) && sha(path.join(appRoot,e.path))===e.sha256);
  if(!same) throw new Error('SOURCE_MANIFEST drift detected');
  console.log('SOURCE VERIFIED');
}
