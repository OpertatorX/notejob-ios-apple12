const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function fail(msg){ console.error('FAIL', msg); process.exit(1); }
function pass(msg){ console.log('PASS', msg); }
function read(p){ return fs.readFileSync(p,'utf8'); }
function sha(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

const factory = JSON.parse(read('factory.app.json'));
if(factory.name !== 'NoteJob') fail('name');
if(factory.slug !== 'notejob') fail('slug');
if(factory.bundle_id !== 'com.operatorx.notejob') fail('bundle id');
if(factory.version !== '1.0.0') fail('version');
if(Number(factory.build_number) !== 6) fail('build number must be 6');
if(factory.app_store_id !== '6814423903') fail('ASC app id');
pass('identity NoteJob 1.0.0 (6)');

const expectedIcon = 'ec370ae9247a4d23adb06d41897ce16b0a313c835c69754bb40b9df7e1bee779';
if(sha('assets/icon.png') !== expectedIcon) fail('FINAL NOTEJOB ICON CHANGED');
pass('final NoteJob buildings + star icon locked');

const rating = read('src/lib/ratings.ts');
for(const token of ['submit_rating_v2','ugc_terms_status','accept_ugc_terms','submit_rating_report','hide_rating','block_rating_author','get_visible_ratings','establishment_stats_v2']){
  if(!rating.includes(token)) fail(`missing ${token}`);
}
pass('Apple 1.2 UGC backend hooks');

const rate = read('src/screens/RateScreen.tsx');
for(const token of ['18 ans','Tolérance zéro','J’accepte et je publie','contact.operatorx@proton.me']){
  if(!rate.includes(token)) fail(`terms gate missing ${token}`);
}
pass('mandatory 18+ EULA gate');

const company = read('src/screens/CompanyScreen.tsx');
for(const token of ['EXPÉRIENCES RÉCENTES','ReviewSafetyModal','Sécurité & contact']){
  if(!company.includes(token)) fail(`company safety UI missing ${token}`);
}
pass('review report/hide/block access');

const legal = read('src/screens/LegalScreen.tsx');
for(const token of ['Tolérance zéro','24 heures','contact.operatorx@proton.me','Masquer immédiatement','Bloquer un utilisateur']){
  if(!legal.includes(token)) fail(`safety/legal missing ${token}`);
}
pass('safety/contact page');

console.log('NOTEJOB BUILD 6 PREFLIGHT PASS');
