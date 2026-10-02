const crypto=require('crypto');
const E='/tmp/easlib/node_modules/eas-cli/build';
const {createGraphqlClient}=require(E+'/commandUtils/context/contextUtils/createGraphqlClient.js');
const {getOwnerAccountForProjectIdAsync}=require(E+'/project/projectUtils.js');
const {getAscApiKeyForAppSubmissionsAsync}=require(E+'/credentials/ios/api/GraphqlClient.js');
const {AppStoreConnectApiKeyQuery}=require(E+'/graphql/queries/AppStoreConnectApiKeyQuery.js');
const APP_BUNDLE='com.operatorx.eventbooth',APP_ID='6818422621',VERSION='1.0',BUILD='2';
function b64url(x){return Buffer.from(x).toString('base64url')}
function jwtFor(k){const n=Math.floor(Date.now()/1000),h={alg:'ES256',kid:k.keyIdentifier,typ:'JWT'},p={iss:k.issuerIdentifier,iat:n-5,exp:n+900,aud:'appstoreconnect-v1'};const s=b64url(JSON.stringify(h))+'.'+b64url(JSON.stringify(p));return s+'.'+crypto.sign('sha256',Buffer.from(s),{key:k.keyP8,dsaEncoding:'ieee-p1363'}).toString('base64url')}
async function api(tok,method,path,body=null,ok=[200]){const r=await fetch('https://api.appstoreconnect.apple.com'+path,{method,headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch{};if(!ok.includes(r.status)){const safe=j?.errors?.map(e=>({status:e.status,code:e.code,title:e.title,detail:e.detail,source:e.source}))??j;throw new Error(method+' '+path+' -> '+r.status+' '+JSON.stringify(safe))}return{status:r.status,data:j}}
async function all(tok,path){let url='https://api.appstoreconnect.apple.com'+path,out=[];while(url){const r=await fetch(url,{headers:{Authorization:'Bearer '+tok}});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch{};if(!r.ok){const safe=j?.errors?.map(e=>({status:e.status,code:e.code,title:e.title,detail:e.detail}))??j;throw new Error('GET '+url+' -> '+r.status+' '+JSON.stringify(safe))}out.push(...(j.data||[]));url=j.links?.next||null}return out}
async function upsertLoc(tok,listPath,createPath,type,relKey,relType,relId,locale,attrs){const rows=await all(tok,listPath);const row=rows.find(x=>x.attributes?.locale===locale);if(row){await api(tok,'PATCH','/v1/'+type+'/'+row.id,{data:{type,id:row.id,attributes:attrs}},[200]);console.log('LOC_UPDATED='+type+'|'+locale);return row.id}const body={data:{type,attributes:{locale,...attrs},relationships:{[relKey]:{data:{type:relType,id:relId}}}}};const r=await api(tok,'POST',createPath,body,[201]);console.log('LOC_CREATED='+type+'|'+locale);return r.data.data.id}
(async()=>{
 const gql=createGraphqlClient({accessToken:process.env.EXPO_TOKEN,sessionSecret:null});
 const account=await getOwnerAccountForProjectIdAsync(gql,process.env.OX_EAS_PROJECT_ID);
 const frag=await getAscApiKeyForAppSubmissionsAsync(gql,{account,projectName:process.env.OX_PROJECT_SLUG,bundleIdentifier:process.env.OX_BUNDLE_ID});
 if(!frag)throw new Error('ASC key fragment missing');
 const key=await AppStoreConnectApiKeyQuery.getByIdAsync(gql,frag.id),tok=jwtFor(key);
 console.log('ASC_KEY=READY');
 const app=(await all(tok,'/v1/apps?filter%5BbundleId%5D='+encodeURIComponent(APP_BUNDLE)+'&fields%5Bapps%5D=name,bundleId,primaryLocale,contentRightsDeclaration'))[0];
 if(!app||app.id!==APP_ID)throw new Error('Event Booth app mismatch');
 console.log('APP_ID='+app.id);
 if(app.attributes?.contentRightsDeclaration!=='DOES_NOT_USE_THIRD_PARTY_CONTENT')await api(tok,'PATCH','/v1/apps/'+APP_ID,{data:{type:'apps',id:APP_ID,attributes:{contentRightsDeclaration:'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}},[200]);
 console.log('CONTENT_RIGHTS=OK');

 const infos=await all(tok,'/v1/apps/'+APP_ID+'/appInfos?fields%5BappInfos%5D=state,appStoreAgeRating&limit=50');
 if(!infos.length)throw new Error('No appInfo');
 const info=infos[0];
 await upsertLoc(tok,'/v1/appInfos/'+info.id+'/appInfoLocalizations?fields%5BappInfoLocalizations%5D=locale,name,subtitle,privacyPolicyUrl&limit=50','/v1/appInfoLocalizations','appInfoLocalizations','appInfo','appInfos',info.id,'en-US',{name:'Event Booth by OperatorX',subtitle:'Photo Booth & Memories',privacyPolicyUrl:'https://operatorx-eventbooth.vercel.app/privacy.html'});
 await upsertLoc(tok,'/v1/appInfos/'+info.id+'/appInfoLocalizations?fields%5BappInfoLocalizations%5D=locale,name,subtitle,privacyPolicyUrl&limit=50','/v1/appInfoLocalizations','appInfoLocalizations','appInfo','appInfos',info.id,'fr-FR',{name:'Event Booth – Livre d’or',subtitle:'Photobooth & souvenirs',privacyPolicyUrl:'https://operatorx-eventbooth.vercel.app/privacy.html'});

 const vers=await all(tok,'/v1/apps/'+APP_ID+'/appStoreVersions?filter%5Bplatform%5D=IOS&filter%5BversionString%5D='+encodeURIComponent(VERSION)+'&fields%5BappStoreVersions%5D=versionString,appVersionState,releaseType,copyright');
 if(!vers.length)throw new Error('App Store version missing');
 const ver=vers[0];
 await api(tok,'PATCH','/v1/appStoreVersions/'+ver.id,{data:{type:'appStoreVersions',id:ver.id,attributes:{copyright:'2026 OperatorX',releaseType:'MANUAL'}}},[200]);
 const fr={description:'Transformez votre iPad en borne élégante pour votre mariage, anniversaire ou événement. Vos invités peuvent prendre des photos, laisser des vidéos, enregistrer des messages vocaux et signer un livre d’or numérique. Tout fonctionne localement, les photos peuvent être partagées immédiatement via les options de partage iOS, et l’ensemble des souvenirs peut être exporté après l’événement.',keywords:"photobooth,mariage,livre d'or,photos,vidéo,audio,événement,souvenirs",marketingUrl:'https://operatorx-eventbooth.vercel.app',promotionalText:'Photos, vidéos, messages vocaux et livre d’or réunis dans une borne élégante pour votre événement.',supportUrl:'https://operatorx-eventbooth.vercel.app/support.html'};
 const en={description:'Turn your iPad into an elegant memory booth for weddings, birthdays and events. Guests can take photos, leave video and voice messages, and sign a digital guestbook. Everything works locally, captured photos can be shared instantly with iOS sharing options, and the complete memory collection can be exported after the event.',keywords:'photobooth,wedding,guestbook,photos,video,audio,event,memories',marketingUrl:'https://operatorx-eventbooth.vercel.app',promotionalText:'Photos, video, voice messages and a digital guestbook in one elegant event booth.',supportUrl:'https://operatorx-eventbooth.vercel.app/support.html'};
 await upsertLoc(tok,'/v1/appStoreVersions/'+ver.id+'/appStoreVersionLocalizations?fields%5BappStoreVersionLocalizations%5D=locale,description,keywords,marketingUrl,promotionalText,supportUrl&limit=50','/v1/appStoreVersionLocalizations','appStoreVersionLocalizations','appStoreVersion','appStoreVersions',ver.id,'fr-FR',fr);
 await upsertLoc(tok,'/v1/appStoreVersions/'+ver.id+'/appStoreVersionLocalizations?fields%5BappStoreVersionLocalizations%5D=locale,description,keywords,marketingUrl,promotionalText,supportUrl&limit=50','/v1/appStoreVersionLocalizations','appStoreVersionLocalizations','appStoreVersion','appStoreVersions',ver.id,'en-US',en);
 console.log('METADATA_LOCALES=OK');

 let av=await api(tok,'GET','/v1/apps/'+APP_ID+'/appAvailabilityV2?fields%5BappAvailabilities%5D=availableInNewTerritories',null,[200,404]);
 if(av.status===404){const territories=await all(tok,'/v1/territories?limit=200'),refs=[],included=[];for(const t of territories){const lid='$'+'{territory-'+t.id+'}';refs.push({type:'territoryAvailabilities',id:lid});included.push({type:'territoryAvailabilities',id:lid,attributes:{available:true},relationships:{territory:{data:{type:'territories',id:t.id}}}})}await api(tok,'POST','/v2/appAvailabilities',{data:{type:'appAvailabilities',attributes:{availableInNewTerritories:true},relationships:{app:{data:{type:'apps',id:APP_ID}},territoryAvailabilities:{data:refs}}},included},[201]);console.log('APP_AVAILABILITY=CREATED')}else console.log('APP_AVAILABILITY=PRESENT');

 let iaps=await all(tok,'/v1/apps/'+APP_ID+'/inAppPurchasesV2?fields%5BinAppPurchases%5D=name,productId,inAppPurchaseType,state,reviewNote,familySharable&limit=200');
 let iap=iaps.find(x=>x.attributes?.productId==='com.operatorx.eventbooth.eventpass');
 if(!iap){iap=(await api(tok,'POST','/v2/inAppPurchases',{data:{type:'inAppPurchases',attributes:{name:'Event Booth Event Pass',productId:'com.operatorx.eventbooth.eventpass',inAppPurchaseType:'CONSUMABLE',familySharable:false,reviewNote:'Unlocks Booth mode for one locally stored event.'},relationships:{app:{data:{type:'apps',id:APP_ID}}}}},[201])).data.data;console.log('EVENTPASS=CREATED|'+iap.id)}else console.log('EVENTPASS=REUSED|'+iap.id);
 const iapDetail=await api(tok,'GET','/v2/inAppPurchases/'+iap.id+'?include=versions&fields%5BinAppPurchaseVersions%5D=version,state&limit%5Bversions%5D=50');
 let iapVersion=(iapDetail.data.included||[]).find(x=>x.type==='inAppPurchaseVersions'&&x.attributes?.state==='PREPARE_FOR_SUBMISSION')||(iapDetail.data.included||[]).find(x=>x.type==='inAppPurchaseVersions');
 if(!iapVersion){iapVersion=(await api(tok,'POST','/v1/inAppPurchaseVersions',{data:{type:'inAppPurchaseVersions',relationships:{inAppPurchase:{data:{type:'inAppPurchases',id:iap.id}}}}},[201])).data.data;console.log('EVENTPASS_VERSION=CREATED|'+iapVersion.id)} else console.log('EVENTPASS_VERSION=REUSED|'+iapVersion.id);
 let iapLocs=await all(tok,'/v1/inAppPurchaseVersions/'+iapVersion.id+'/localizations?fields%5BinAppPurchaseLocalizations%5D=name,locale,description&limit=200');
 for(const [locale,name,description] of [['fr-FR','Pass Événement','Débloque le mode borne et les souvenirs illimités pour un événement.'],['en-US','Event Pass','Unlocks Booth mode and unlimited memories for one event.']]){const ex=iapLocs.find(x=>x.attributes?.locale===locale);if(ex)await api(tok,'PATCH','/v2/inAppPurchaseLocalizations/'+ex.id,{data:{type:'inAppPurchaseLocalizations',id:ex.id,attributes:{name,description}}},[200]);else await api(tok,'POST','/v2/inAppPurchaseLocalizations',{data:{type:'inAppPurchaseLocalizations',attributes:{locale,name,description},relationships:{version:{data:{type:'inAppPurchaseVersions',id:iapVersion.id}}}}},[201])}
 console.log('EVENTPASS_LOCALIZATIONS=OK');
 const availLink=await api(tok,'GET','/v2/inAppPurchases/'+iap.id+'/relationships/inAppPurchaseAvailability',null,[200,404]);
 if(availLink.status===404||!availLink.data?.data){
   const terrs=await all(tok,'/v1/territories?limit=200');
   await api(tok,'POST','/v1/inAppPurchaseAvailabilities',{data:{type:'inAppPurchaseAvailabilities',attributes:{availableInNewTerritories:true},relationships:{availableTerritories:{data:terrs.map(t=>({type:'territories',id:t.id}))},inAppPurchase:{data:{type:'inAppPurchases',id:iap.id}}}}},[201]);
   console.log('EVENTPASS_AVAILABILITY=CREATED|territories='+terrs.length);
 } else console.log('EVENTPASS_AVAILABILITY=PRESENT');
 const iapSchedule=await api(tok,'GET','/v2/inAppPurchases/'+iap.id+'/iapPriceSchedule',null,[200,404]);
 if(iapSchedule.status===404){const pps=await all(tok,'/v2/inAppPurchases/'+iap.id+'/pricePoints?filter%5Bterritory%5D=FRA&fields%5BinAppPurchasePricePoints%5D=customerPrice,territory&limit=8000');const pp=pps.find(x=>String(x.attributes?.customerPrice)==='7.99');if(!pp)throw new Error('FRA Event Pass price point 7.99 missing');const lid='$'+'{price-1}';const body={data:{type:'inAppPurchasePriceSchedules',relationships:{inAppPurchase:{data:{type:'inAppPurchases',id:iap.id}},baseTerritory:{data:{type:'territories',id:'FRA'}},manualPrices:{data:[{type:'inAppPurchasePrices',id:lid}]}}},included:[{type:'inAppPurchasePrices',id:lid,attributes:{startDate:null},relationships:{inAppPurchaseV2:{data:{type:'inAppPurchases',id:iap.id}},inAppPurchasePricePoint:{data:{type:'inAppPurchasePricePoints',id:pp.id}}}}]};await api(tok,'POST','/v1/inAppPurchasePriceSchedules',body,[201]);console.log('EVENTPASS_PRICE=7.99_CREATED')}else console.log('EVENTPASS_PRICE=PRESENT');

 const GROUP_NAME='Event Booth Pro';
 let groups=await all(tok,'/v1/apps/'+APP_ID+'/subscriptionGroups?fields%5BsubscriptionGroups%5D=referenceName&limit=200'),group=groups.find(g=>g.attributes?.referenceName===GROUP_NAME);
 if(!group){group=(await api(tok,'POST','/v1/subscriptionGroups',{data:{type:'subscriptionGroups',attributes:{referenceName:GROUP_NAME},relationships:{app:{data:{type:'apps',id:APP_ID}}}}},[201])).data.data;console.log('SUB_GROUP=CREATED|'+group.id)}else console.log('SUB_GROUP=REUSED|'+group.id);
 const glocs=await all(tok,'/v1/subscriptionGroups/'+group.id+'/subscriptionGroupLocalizations?fields%5BsubscriptionGroupLocalizations%5D=locale,name&limit=200');
 for(const locale of ['fr-FR','en-US'])if(!glocs.some(x=>x.attributes?.locale===locale))await api(tok,'POST','/v1/subscriptionGroupLocalizations',{data:{type:'subscriptionGroupLocalizations',attributes:{locale,name:'Event Booth Pro'},relationships:{subscriptionGroup:{data:{type:'subscriptionGroups',id:group.id}}}}},[201]);

 let subs=await all(tok,'/v1/subscriptionGroups/'+group.id+'/subscriptions?fields%5Bsubscriptions%5D=name,productId,subscriptionPeriod,groupLevel,state&limit=200'),sub=subs.find(x=>x.attributes?.productId==='com.operatorx.eventbooth.pro.annual');
 if(!sub){sub=(await api(tok,'POST','/v1/subscriptions',{data:{type:'subscriptions',attributes:{name:'Event Booth Pro Annual',productId:'com.operatorx.eventbooth.pro.annual',familySharable:false,subscriptionPeriod:'ONE_YEAR',groupLevel:1,reviewNote:'Unlocks unlimited events while the annual subscription is active.'},relationships:{group:{data:{type:'subscriptionGroups',id:group.id}}}}},[201])).data.data;console.log('PRO_ANNUAL=CREATED|'+sub.id)}else console.log('PRO_ANNUAL=REUSED|'+sub.id);
 const slocs=await all(tok,'/v1/subscriptions/'+sub.id+'/subscriptionLocalizations?fields%5BsubscriptionLocalizations%5D=locale,name,description&limit=200');
 for(const [locale,name,description] of [['fr-FR','Event Booth Pro – Annuel','Événements illimités pendant un an.'],['en-US','Event Booth Pro – Annual','Unlimited events for one year.']]){const ex=slocs.find(x=>x.attributes?.locale===locale);if(ex)await api(tok,'PATCH','/v1/subscriptionLocalizations/'+ex.id,{data:{type:'subscriptionLocalizations',id:ex.id,attributes:{name,description}}},[200]);else await api(tok,'POST','/v1/subscriptionLocalizations',{data:{type:'subscriptionLocalizations',attributes:{locale,name,description},relationships:{subscription:{data:{type:'subscriptions',id:sub.id}}}}},[201])}
 const spp=await all(tok,'/v1/subscriptions/'+sub.id+'/pricePoints?filter%5Bterritory%5D=FRA&fields%5BsubscriptionPricePoints%5D=customerPrice,territory&limit=8000'),anchor=spp.find(x=>String(x.attributes?.customerPrice)==='39.99');
 if(!anchor)throw new Error('FRA annual price point 39.99 missing');
 const eq=await all(tok,'/v1/subscriptionPricePoints/'+anchor.id+'/equalizations?filter%5Bsubscription%5D='+sub.id+'&include=territory&limit=8000'),t2p=new Map([['FRA',anchor.id]]);
 for(const pp of eq){const tid=pp.relationships?.territory?.data?.id;if(tid)t2p.set(tid,pp.id)}
 console.log('PRO_EQUALIZED_TERRITORIES='+t2p.size);
 let plans=await all(tok,'/v1/subscriptions/'+sub.id+'/planAvailabilities?fields%5BsubscriptionPlanAvailabilities%5D=availableInNewTerritories,planType&limit=200'),upfront=plans.find(x=>x.attributes?.planType==='UPFRONT');
 const tdata=[...t2p.keys()].sort().map(id=>({type:'territories',id}));
 if(!upfront)upfront=(await api(tok,'POST','/v1/subscriptionPlanAvailabilities',{data:{type:'subscriptionPlanAvailabilities',attributes:{planType:'UPFRONT',availableInNewTerritories:true},relationships:{subscription:{data:{type:'subscriptions',id:sub.id}},availableTerritories:{data:tdata}}}},[201])).data.data;else{await api(tok,'PATCH','/v1/subscriptionPlanAvailabilities/'+upfront.id,{data:{type:'subscriptionPlanAvailabilities',id:upfront.id,attributes:{availableInNewTerritories:true}}},[200]);await api(tok,'PATCH','/v1/subscriptionPlanAvailabilities/'+upfront.id+'/relationships/availableTerritories',{data:tdata},[204])}
 const prices=await all(tok,'/v1/subscriptions/'+sub.id+'/prices?filter%5BplanType%5D=UPFRONT&include=territory&fields%5BsubscriptionPrices%5D=startDate,preserved,planType,territory,subscriptionPricePoint&limit=200'),existing=new Set(prices.map(p=>p.relationships?.territory?.data?.id).filter(Boolean));let made=0;
 for(const [territoryId,ppid] of t2p){if(existing.has(territoryId))continue;await api(tok,'POST','/v1/subscriptionPrices',{data:{type:'subscriptionPrices',attributes:{startDate:null,planType:'UPFRONT'},relationships:{subscription:{data:{type:'subscriptions',id:sub.id}},subscriptionPricePoint:{data:{type:'subscriptionPricePoints',id:ppid}}}}},[201]);made++}
 console.log('PRO_PRICES_CREATED='+made);

 const builds=await all(tok,'/v1/builds?filter%5Bapp%5D='+APP_ID+'&filter%5Bversion%5D='+BUILD+'&fields%5Bbuilds%5D=version,expired,processingState,buildAudienceType,uploadedDate&limit=50');
 console.log('BUILD2_COUNT='+builds.length);
 for(const b of builds)console.log('BUILD2='+b.id+'|'+b.attributes?.processingState+'|'+b.attributes?.buildAudienceType+'|expired='+b.attributes?.expired);
 const eligible=builds.find(b=>b.attributes?.version===BUILD&&!b.attributes?.expired&&b.attributes?.processingState==='VALID');
 if(eligible){await api(tok,'PATCH','/v1/appStoreVersions/'+ver.id+'/relationships/build',{data:{type:'builds',id:eligible.id}},[204]);console.log('BUILD2_ATTACHED=yes')}else console.log('BUILD2_ATTACHED=no');
 console.log('EVENTBOOTH_ASC_SETUP=PASS');
})().catch(e=>{console.error('EVENTBOOTH_ASC_SETUP=FAIL');console.error(e.stack||e.message);process.exit(1)});