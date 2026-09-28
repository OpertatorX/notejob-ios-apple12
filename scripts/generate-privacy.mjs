#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const appRoot=path.resolve(process.argv[2]||process.cwd());
const cfg=JSON.parse(fs.readFileSync(path.join(appRoot,'app.operatorx.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8'));
const deps=Object.keys({...pkg.dependencies,...pkg.devDependencies});
const ad=Boolean(cfg.monetization?.admob);
const iap=Boolean(cfg.monetization?.iap)||deps.includes('expo-iap');
const analytics=Boolean(cfg.features?.analytics)||deps.some(x=>/analytics|firebase|sentry|amplitude|segment/i.test(x));
const lines=[
`# Apple App Privacy - ${cfg.name} ${cfg.version}`,'',
'> Manual App Store Connect step. Verify this against the final production binary before submission.','',
'## Tracking',
`- Data Used to Track You: **${ad?'Re-check final ad configuration':'No'}**`,
`- ATT: **${ad?'Re-check final ad configuration':'No'}**`,
`- Advertising: **${ad?'Re-check final ad configuration':'No'}**`,'',
'## Data stored only on device (not collected by OperatorX)',
'- Business details and logo',
'- Client names/contact details',
'- Estimates, invoices, line items, notes, prices, taxes',
'- Generated PDFs and local JSON exports',
'',
'Photo Library access occurs only when the user selects a business logo. OX Invoice does not upload that photo.',''
];
if(iap){lines.push(
'## Purchase verification',
'OX Invoice uses Apple In-App Purchase and IAPKit/OpenIAP for entitlement verification. A store purchase token / transaction proof is sent for verification.','',
'Recommended App Privacy declaration for the current architecture:',
'- **Purchases > Purchase History: Collected**',
'  - Purpose: **App Functionality**',
'  - Linked to the user: **No**, provided the production verification configuration does not add account identifiers',
'  - Used for tracking: **No**','',
'Before publishing App Privacy, confirm the production verification provider retention/configuration. If it records additional identifiers or diagnostics, add those categories as required.',''
);}
lines.push(
'## Current SDK posture',
`- Ad SDK: **${ad?'present - inspect final behavior':'none'}**`,
`- Product analytics SDK: **${analytics?'present - inspect final behavior':'none'}**`,
'- No OX Invoice account/user profile is required.','',
'## Final manual checks',
'1. Inspect the final native binary and dependency lockfile.',
'2. Confirm no analytics/ad SDK was added after this checklist.',
'3. Confirm IAPKit/OpenIAP production data handling.',
'4. Publish App Privacy in App Store Connect only after these checks.'
);
const out=path.join(appRoot,'apple','APPLE_APP_PRIVACY_CHECKLIST.md');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,lines.join('\n')+'\n','utf8');
console.log(out);
