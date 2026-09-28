#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { auditApp, formatReport, summarize } from './lib/audit.mjs';

const appRoot=path.resolve(process.argv[2]||process.cwd());
const diagnostic=process.argv.includes('--diagnostic');
const findings=auditApp(appRoot,{production:!diagnostic});
const report=formatReport(findings);
console.log(report);
const out=path.join(appRoot,'release','AUDIT_REPORT.txt');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,report+'\n',{encoding:'utf8'});
process.exit(summarize(findings).eligible?0:1);
