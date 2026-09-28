const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = process.cwd();
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.git','supabase'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
}
walk(root);
let errors = 0;
for (const file of files) {
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  });
  const diagnostics = (out.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length) {
    errors += diagnostics.length;
    console.error('FAIL', path.relative(root, file));
    for (const d of diagnostics) console.error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }
}
if (errors) process.exit(1);
console.log(`PASS TypeScript/TSX syntax (${files.length} files)`);
