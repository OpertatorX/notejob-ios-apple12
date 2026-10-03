const crypto=require('crypto');
const E='/tmp/easlib/node_modules/eas-cli/build';
const {createGraphqlClient}=require(E+'/commandUtils/context/contextUtils/createGraphqlClient.js');
const {getOwnerAccountForProjectIdAsync}=require(E+'/project/projectUtils.js');
const {getAscApiKeyForAppSubmissionsAsync}=require(E+'/credentials/ios/api/GraphqlClient.js');
const {AppStoreConnectApiKeyQuery}=require(E+'/graphql/queries/AppStoreConnectApiKeyQuery.js');
const APP='6818422621', VERSION='1.0';
const EULA='https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const b64url=x=>Buffer.from(x).toString('base64url');
function jwtFor(k){const n=Math.floor(Date.now()/1000),h={alg:'ES256',kid:k.keyIdentifier,typ:'JWT'},p={iss:k.issuerIdentifier,iat:n-5,exp:n+900,aud:'appstoreconnect-v1'};const s=b64url(JSON.stringify(h))+'.'+b64url(JSON.stringify(p));return s+'.'+crypto.sign('sha256',Buffer.from(s),{key:k.keyP8,dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function req(tok,m,u,b=null,ok=[200]){const r=await fetch('https://api.appstoreconnect.apple.com'+u,{method:m,headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch{};if(!ok.includes(r.status))throw new Error(m+' '+u+' -> '+r.status+' '+JSON.stringify(j?.errors||j).slice(0,1800));return{status:r.status,data:j}}
async function all(tok,u){let next=u,out=[];while(next){const p=next.startsWith('http')?next.replace('https://api.appstoreconnect.apple.com',''):next;const r=await req(tok,'GET',p);out.push(...(r.data?.data||[]));next=r.data?.links?.next||null}return out}
(async()=>{
  const gql=createGraphqlClient({accessToken:process.env.EXPO_TOKEN,sessionSecret:null});
  const account=await getOwnerAccountForProjectIdAsync(gql,process.env.OX_EAS_PROJECT_ID);
  const frag=await getAscApiKeyForAppSubmissionsAsync(gql,{account,projectName:process.env.OX_PROJECT_SLUG,bundleIdentifier:process.env.OX_BUNDLE_ID});
  if(!frag)throw new Error('ASC_KEY_FRAGMENT_MISSING');
  const key=await AppStoreConnectApiKeyQuery.getByIdAsync(gql,frag.id),tok=jwtFor(key);
  const versions=await all(tok,'/v1/apps/'+APP+'/appStoreVersions?filter%5Bplatform%5D=IOS&filter%5BversionString%5D='+VERSION+'&fields%5BappStoreVersions%5D=versionString,appVersionState');
  if(!versions.length)throw new Error('VERSION_MISSING');
  const locs=await all(tok,'/v1/appStoreVersions/'+versions[0].id+'/appStoreVersionLocalizations?fields%5BappStoreVersionLocalizations%5D=locale,description&limit=50');
  for(const locale of ['fr-FR','en-US']){
    const loc=locs.find(x=>x.attributes?.locale===locale); if(!loc)throw new Error('LOCALE_MISSING_'+locale);
    let d=loc.attributes?.description||'';
    const line=locale==='fr-FR'?'Conditions d’utilisation (EULA) : '+EULA:'Terms of Use (EULA): '+EULA;
    if(!d.includes(EULA)) d=d.trim()+'\n\n'+line;
    await req(tok,'PATCH','/v1/appStoreVersionLocalizations/'+loc.id,{data:{type:'appStoreVersionLocalizations',id:loc.id,attributes:{description:d}}},[200]);
    console.log('EULA_DESCRIPTION_UPDATED='+locale+'|length='+d.length);
  }
  const check=await all(tok,'/v1/appStoreVersions/'+versions[0].id+'/appStoreVersionLocalizations?fields%5BappStoreVersionLocalizations%5D=locale,description&limit=50');
  for(const locale of ['fr-FR','en-US']){const d=check.find(x=>x.attributes?.locale===locale)?.attributes?.description||'';if(!d.includes(EULA))throw new Error('EULA_VERIFY_FAIL_'+locale);console.log('EULA_VERIFY=PASS|'+locale)}
  console.log('EVENTBOOTH_EULA_METADATA_FIX=PASS');
})().catch(e=>{console.error('EVENTBOOTH_EULA_METADATA_FIX=FAIL');console.error(e.stack||e.message);process.exit(1)});
