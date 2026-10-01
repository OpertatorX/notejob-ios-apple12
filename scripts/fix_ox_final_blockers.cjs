const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT='/tmp/easlib/node_modules/eas-cli/build';
const {createGraphqlClient}=require(ROOT+'/commandUtils/context/contextUtils/createGraphqlClient.js');
const {getOwnerAccountForProjectIdAsync}=require(ROOT+'/project/projectUtils.js');
const {getAscApiKeyForAppSubmissionsAsync}=require(ROOT+'/credentials/ios/api/GraphqlClient.js');
const {AppStoreConnectApiKeyQuery}=require(ROOT+'/graphql/queries/AppStoreConnectApiKeyQuery.js');

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b64url=x=>Buffer.from(x).toString('base64url');

function jwtFor(k){
  const now=Math.floor(Date.now()/1000);
  const h={alg:'ES256',kid:k.keyIdentifier,typ:'JWT'};
  const p={iss:k.issuerIdentifier,iat:now-5,exp:now+900,aud:'appstoreconnect-v1'};
  const s=b64url(JSON.stringify(h))+'.'+b64url(JSON.stringify(p));
  const sig=crypto.sign('sha256',Buffer.from(s),{key:k.keyP8,dsaEncoding:'ieee-p1363'});
  return s+'.'+sig.toString('base64url');
}

async function req(tok,method,url,body=null,ok=[200]){
  const full=url.startsWith('http')?url:'https://api.appstoreconnect.apple.com'+url;
  for(let attempt=1;attempt<=5;attempt++){
    const isAppleApi=full.startsWith('https://api.appstoreconnect.apple.com');
    const headers=isAppleApi?{Authorization:'Bearer '+tok,'Content-Type':'application/json'}:{};
    const r=await fetch(full,{method,headers,body:body?(Buffer.isBuffer(body)?body:JSON.stringify(body)):undefined});
    const txt=await r.text(); let j=null; try{j=txt?JSON.parse(txt):null}catch{j=txt}
    if(ok.includes(r.status)) return {status:r.status,data:j,headers:r.headers};
    if(r.status>=500 && attempt<5){await sleep(attempt*1500);continue}
    const safe=j?.errors?.map(e=>({status:e.status,code:e.code,title:e.title,detail:e.detail,source:e.source}))??j;
    throw new Error(method+' '+url+' -> '+r.status+' '+JSON.stringify(safe));
  }
}

async function all(tok,url){
  let next=url,out=[];
  while(next){
    const r=await req(tok,'GET',next,null,[200]);
    out.push(...(r.data?.data||[]));
    next=r.data?.links?.next||null;
  }
  return out;
}

async function uploadAsset(tok,shot,bytes){
  const ops=shot.attributes?.uploadOperations||[];
  if(!ops.length) throw new Error('No uploadOperations for '+shot.id);
  for(const op of ops){
    const off=Number(op.offset||0), len=Number(op.length||0);
    const chunk=bytes.subarray(off,off+len);
    const headers={};
    for(const h of op.requestHeaders||[]) headers[h.name]=h.value;
    const r=await fetch(op.url,{method:op.method||'PUT',headers,body:chunk});
    if(!r.ok) throw new Error('Asset PUT failed '+r.status+' '+await r.text());
  }
  await req(tok,'PATCH','/v1/appScreenshots/'+shot.id,{
    data:{type:'appScreenshots',id:shot.id,attributes:{uploaded:true}}
  },[200]);
}

async function uploadSet(tok,loc,locale,type,dir){
  let sets=await all(tok,'/v1/appStoreVersionLocalizations/'+loc.id+'/appScreenshotSets?fields%5BappScreenshotSets%5D=screenshotDisplayType');
  let set=sets.find(x=>x.attributes?.screenshotDisplayType===type);
  if(!set){
    const made=await req(tok,'POST','/v1/appScreenshotSets',{
      data:{
        type:'appScreenshotSets',
        attributes:{screenshotDisplayType:type},
        relationships:{appStoreVersionLocalization:{data:{type:'appStoreVersionLocalizations',id:loc.id}}}
      }
    },[201]);
    set=made.data.data;
    console.log('SET_CREATED='+locale+'|'+type+'|'+set.id);
  }

  const old=await all(tok,'/v1/appScreenshotSets/'+set.id+'/appScreenshots?fields%5BappScreenshots%5D=fileName,assetDeliveryState');
  const oldStates=old.map(s=>s.attributes?.assetDeliveryState?.state||'UNKNOWN');
  if(old.length===5 && oldStates.every(s=>String(s).toUpperCase()==='COMPLETE')){
    console.log('SET_ALREADY_COMPLETE='+locale+'|'+type+'|count=5');
    return;
  }
  for(const s of old) await req(tok,'DELETE','/v1/appScreenshots/'+s.id,null,[204]);

  for(let i=1;i<=5;i++){
    const file=path.join(dir,locale,i+'.jpg');
    const bytes=fs.readFileSync(file);
    const made=await req(tok,'POST','/v1/appScreenshots',{
      data:{
        type:'appScreenshots',
        attributes:{fileName:'OX-Invoice-'+type+'-'+locale+'-'+String(i).padStart(2,'0')+'.jpg',fileSize:bytes.length},
        relationships:{appScreenshotSet:{data:{type:'appScreenshotSets',id:set.id}}}
      }
    },[201]);
    await uploadAsset(tok,made.data.data,bytes);
    console.log('UPLOADED='+locale+'|'+type+'|'+i);
  }

  for(let wait=0;wait<40;wait++){
    const live=await all(tok,'/v1/appScreenshotSets/'+set.id+'/appScreenshots?fields%5BappScreenshots%5D=fileName,assetDeliveryState');
    const states=live.map(s=>s.attributes?.assetDeliveryState?.state||'UNKNOWN');
    console.log('VERIFY='+locale+'|'+type+'|count='+live.length+'|states='+states.join(','));
    if(live.length===5 && states.every(s=>String(s).toUpperCase()==='COMPLETE')) return;
    if(wait===39) throw new Error('Screenshot processing timeout '+locale+' '+type);
    await sleep(3000);
  }
}

(async()=>{
  const gql=createGraphqlClient({accessToken:process.env.EXPO_TOKEN,sessionSecret:null});
  const account=await getOwnerAccountForProjectIdAsync(gql,process.env.OX_EAS_PROJECT_ID);
  const frag=await getAscApiKeyForAppSubmissionsAsync(gql,{
    account,projectName:process.env.OX_PROJECT_SLUG,bundleIdentifier:process.env.OX_BUNDLE_ID
  });
  if(!frag) throw new Error('ASC key missing');
  const key=await AppStoreConnectApiKeyQuery.getByIdAsync(gql,frag.id);
  const tok=jwtFor(key);

  const apps=await all(tok,'/v1/apps?filter%5BbundleId%5D='+encodeURIComponent(process.env.OX_BUNDLE_ID)+'&fields%5Bapps%5D=name,bundleId');
  if(apps.length!==1) throw new Error('App lookup failed');
  const appId=apps[0].id;
  console.log('APP_ID='+appId);

  const vers=await all(tok,'/v1/apps/'+appId+'/appStoreVersions?filter%5Bplatform%5D=IOS&filter%5BversionString%5D='+encodeURIComponent(process.env.OX_VERSION)+'&fields%5BappStoreVersions%5D=versionString,appVersionState');
  if(!vers.length) throw new Error('Version missing');
  const vid=vers[0].id;
  const locs=await all(tok,'/v1/appStoreVersions/'+vid+'/appStoreVersionLocalizations?fields%5BappStoreVersionLocalizations%5D=locale');

  for(const locale of ['fr-FR','en-US']){
    const loc=locs.find(x=>x.attributes?.locale===locale);
    if(!loc) throw new Error('Missing locale '+locale);
    await uploadSet(tok,loc,locale,'APP_IPHONE_65','shots');
    await uploadSet(tok,loc,locale,'APP_IPAD_PRO_3GEN_129','shots-ipad');
  }

  const ps=await req(tok,'GET','/v1/apps/'+appId+'/appPriceSchedule',null,[200,404]);
  const scheduleId=ps.data?.data?.id || appId;
  let manual=[];
  if(ps.status===200 && ps.data?.data){
    manual=await all(tok,'/v1/appPriceSchedules/'+scheduleId+'/manualPrices?limit=200&include=appPricePoint,territory&fields%5BappPrices%5D=manual,startDate,endDate,appPricePoint,territory&fields%5BappPricePoints%5D=customerPrice,proceeds&fields%5Bterritories%5D=currency');
  }
  console.log('APP_MANUAL_PRICE_ROWS_BEFORE='+manual.length);

  const now=new Date();
  const active=manual.filter(p=>{
    const a=p.attributes||{};
    const start=!a.startDate || new Date(a.startDate+'T00:00:00Z')<=now;
    const end=!a.endDate || new Date(a.endDate+'T23:59:59Z')>=now;
    return start&&end;
  });
  console.log('APP_ACTIVE_PRICE_ROWS_BEFORE='+active.length);

  if(active.length===0){
    const points=await all(tok,'/v1/apps/'+appId+'/appPricePoints?filter%5Bterritory%5D=FRA&include=territory&fields%5BappPricePoints%5D=customerPrice,proceeds,territory&fields%5Bterritories%5D=currency&limit=200');
    const zero=points.find(x=>Number(x.attributes?.customerPrice)===0);
    if(!zero) throw new Error('Free FRA app price point not found');
    console.log('FREE_PRICE_POINT='+zero.id);

    const localId='$'+'{price-0}';
    await req(tok,'POST','/v1/appPriceSchedules',{
      data:{
        type:'appPriceSchedules',
        relationships:{
          app:{data:{type:'apps',id:appId}},
          manualPrices:{data:[{type:'appPrices',id:localId}]},
          baseTerritory:{data:{type:'territories',id:'FRA'}}
        }
      },
      included:[{
        type:'appPrices',
        id:localId,
        attributes:{startDate:null,endDate:null},
        relationships:{appPricePoint:{data:{type:'appPricePoints',id:zero.id}}}
      }]
    },[201]);
    console.log('APP_PRICE_SET=FREE');
    await sleep(2500);
  } else {
    console.log('APP_PRICE_SET=already_active');
  }

  const ps2=await req(tok,'GET','/v1/apps/'+appId+'/appPriceSchedule',null,[200]);
  const sid2=ps2.data.data.id;
  const query=await req(tok,'GET','/v1/appPriceSchedules/'+sid2+'/manualPrices?limit=200&include=appPricePoint,territory&fields%5BappPrices%5D=manual,startDate,endDate,appPricePoint,territory&fields%5BappPricePoints%5D=customerPrice,proceeds&fields%5Bterritories%5D=currency');
  const includedPrices=(query.data?.included||[]).filter(x=>x.type==='appPricePoints').map(x=>x.attributes?.customerPrice);
  console.log('APP_PRICE_POINTS_AFTER='+includedPrices.join(','));
  if(!includedPrices.some(x=>Number(x)===0)) throw new Error('Free app price not verified');

  console.log('FINAL_BLOCKERS_FIX=PASS');
})().catch(e=>{console.error('FINAL_BLOCKERS_FIX=FAIL');console.error(e.stack||e.message);process.exit(1)});
