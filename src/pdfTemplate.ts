import type { BusinessProfile, QuoteDocument } from './types';
import { calculateTotals, formatMoney } from './domain';

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function nl(value: string): string { return esc(value).replaceAll('\n', '<br/>'); }

function docLabel(doc: QuoteDocument, lang: 'fr' | 'en'): string {
  if (lang === 'fr') return doc.kind === 'invoice' ? 'FACTURE' : 'DEVIS';
  return doc.kind === 'invoice' ? 'INVOICE' : 'ESTIMATE';
}

export function buildDocumentHtml(
  business: BusinessProfile,
  doc: QuoteDocument,
  language: 'fr' | 'en' = business.language,
): string {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const totals = calculateTotals(doc);
  const money = (n: number) => formatMoney(n, business.currency, locale);
  const accent = /^#[0-9a-f]{6}$/i.test(business.accent) ? business.accent : '#0A2540';
  const labels = language === 'fr'
    ? { from:'De', bill:'Facturé à', desc:'Description', qty:'Qté', rate:'Prix', amount:'Montant', subtotal:'Sous-total', discount:'Remise', tax:'Taxe', total:'Total', deposit:'Acompte', balance:'Reste à payer', issue:'Émis le', due:'Échéance', valid:'Valable jusqu’au', notes:'Notes', payment:'Paiement' }
    : { from:'From', bill:'Bill to', desc:'Description', qty:'Qty', rate:'Rate', amount:'Amount', subtotal:'Subtotal', discount:'Discount', tax:'Tax', total:'Total', deposit:'Deposit', balance:'Balance due', issue:'Issue date', due:'Due date', valid:'Valid until', notes:'Notes', payment:'Payment' };
  const businessInitial = esc((business.name.trim().charAt(0) || 'B').toUpperCase());
  const logo = business.logoDataUri
    ? `<img class="logo-image" src="${business.logoDataUri}" />`
    : `<div class="logo-mark">${businessInitial}</div>`;
  const businessName = esc(business.name || 'OX Invoice');
  const businessLines = [business.address, business.email, business.phone, business.taxId, business.website].filter(Boolean).map(nl).join('<br/>');
  const clientLines = [doc.client.address, doc.client.email, doc.client.phone].filter(Boolean).map(nl).join('<br/>');
  const rows = doc.items.map(item => `
    <tr>
      <td class="description"><strong>${esc(item.title || '-')}</strong>${item.details ? `<span>${nl(item.details)}</span>` : ''}</td>
      <td class="num">${Number(item.quantity || 0).toLocaleString(locale)}</td>
      <td class="num">${money(item.rate || 0)}</td>
      <td class="num strong">${money((item.quantity || 0) * (item.rate || 0))}</td>
    </tr>`).join('');

  const templateClass = `template-${business.pdfTemplate}`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @page { size: A4; margin: 16mm 17mm 16mm; }
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{margin:0;padding:0;background:#fff;color:#152033;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
  body{font-size:10.8px;line-height:1.45}
  .page{width:auto;min-height:265mm;padding:0;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12mm;border-bottom:1px solid #E6E8EC}
  .brand{display:flex;align-items:center;gap:10px;width:58%;max-width:58%;min-width:0}
  .logo-mark{width:32px;height:32px;border-radius:9px;background:${accent};color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800}
  .logo-image{max-width:122px;max-height:42px;object-fit:contain}
  .brand-name{font-size:16px;font-weight:750;letter-spacing:-.2px;color:#0D1B2E;overflow-wrap:anywhere}.brand>div{min-width:0}
  .brand-sub{font-size:9px;color:#667085;margin-top:2px}
  .doc-head{text-align:right;width:38%;flex:0 0 38%}
  .doc-type{font-size:24px;line-height:1;font-weight:800;letter-spacing:.9px;color:${accent}}
  .doc-number{font-size:10px;color:#667085;margin-top:5px}
  .dates{margin-top:10px;display:grid;grid-template-columns:auto auto;gap:2px 10px;font-size:9px;color:#667085}
  .dates b{color:#344054;font-weight:600}
  .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:22mm;margin:11mm 0 9mm}
  .eyebrow{text-transform:uppercase;letter-spacing:.9px;font-size:8px;color:#98A2B3;font-weight:700;margin-bottom:5px}
  .party-name{font-weight:700;font-size:11px;color:#101828;margin-bottom:3px}
  .party-lines{color:#667085;line-height:1.55}
  table{width:100%;border-collapse:collapse;table-layout:fixed} thead{display:table-header-group} tr{break-inside:avoid;page-break-inside:avoid}
  thead th{padding:7px 8px;background:#F3F5F7;color:#475467;font-size:8.5px;text-transform:uppercase;letter-spacing:.45px;text-align:left;border-bottom:1px solid #E4E7EC}
  th:nth-child(1){width:55%} th:nth-child(2){width:9%} th:nth-child(3){width:18%} th:nth-child(4){width:18%}
  tbody td{padding:9px 8px;border-bottom:1px solid #EAECF0;vertical-align:top}
  .description strong{font-size:10px;color:#1D2939}.description span{display:block;color:#7A8494;font-size:8.8px;margin-top:2px}
  .num{text-align:right;white-space:nowrap}.strong{font-weight:700;color:#101828}
  .bottom{display:grid;grid-template-columns:1fr 68mm;gap:15mm;margin-top:10mm;align-items:start;break-inside:avoid;page-break-inside:avoid}
  .notes{color:#667085;white-space:normal}.notes .copy{margin-top:5px;line-height:1.65}.payment-block{margin-top:8mm}
  .totals{width:100%}.total-row{display:flex;justify-content:space-between;padding:3px 0;color:#667085}.total-row strong{color:#344054}
  .grand{margin-top:5px;padding:8px 10px;border-radius:7px;background:${accent}10;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;color:#0D1B2E;border:1px solid ${accent}18}
  .balance{margin-top:5px;color:${accent};font-weight:700;display:flex;justify-content:space-between}
  .footer{margin-top:14mm;border-top:1px solid #EEF0F3;padding-top:5mm;color:#98A2B3;font-size:8px;display:flex;justify-content:space-between;break-inside:avoid;page-break-inside:avoid}
  .template-modern .header{border:0;padding:10mm 17mm;background:${accent};margin:-16mm -17mm 10mm;color:#fff}
  .template-modern .brand-name,.template-modern .doc-type{color:#fff}.template-modern .brand-sub,.template-modern .doc-number,.template-modern .dates,.template-modern .dates b{color:#D8E1EA}
  .template-modern .logo-mark{background:#fff;color:${accent}}
  .template-modern thead th{background:${accent};color:white;border:0}
  .template-minimal .logo-mark{background:#fff;color:${accent};border:1px solid #D0D5DD}.template-minimal .doc-type{font-weight:650}.template-minimal thead th{background:#fff;border-top:1px solid #D0D5DD;border-bottom:1px solid #D0D5DD}
</style></head>
<body><main class="page ${templateClass}">
  <header class="header">
    <div class="brand">${logo}<div><div class="brand-name">${businessName}</div>${business.website ? `<div class="brand-sub">${esc(business.website)}</div>` : ''}</div></div>
    <div class="doc-head"><div class="doc-type">${docLabel(doc, language)}</div><div class="doc-number">#${esc(doc.number)}</div><div class="dates"><span>${labels.issue}</span><b>${esc(doc.issueDate)}</b><span>${doc.kind === 'estimate' ? labels.valid : labels.due}</span><b>${esc(doc.dueDate)}</b></div></div>
  </header>
  <section class="party-grid">
    <div><div class="eyebrow">${labels.from}</div><div class="party-name">${businessName}</div><div class="party-lines">${businessLines || '-'}</div></div>
    <div><div class="eyebrow">${labels.bill}</div><div class="party-name">${esc(doc.client.name || '-')}</div><div class="party-lines">${clientLines || '-'}</div></div>
  </section>
  <table><thead><tr><th>${labels.desc}</th><th class="num">${labels.qty}</th><th class="num">${labels.rate}</th><th class="num">${labels.amount}</th></tr></thead><tbody>${rows || '<tr><td colspan="4">-</td></tr>'}</tbody></table>
  <section class="bottom">
    <div class="notes">${doc.notes ? `<div class="eyebrow">${labels.notes}</div><div class="copy">${nl(doc.notes)}</div>` : ''}${business.paymentDetails ? `<div class="payment-block"><div class="eyebrow">${labels.payment}</div><div class="copy">${nl(business.paymentDetails)}</div></div>` : ''}</div>
    <div class="totals">
      <div class="total-row"><span>${labels.subtotal}</span><strong>${money(totals.subtotal)}</strong></div>
      ${doc.discountPct > 0 ? `<div class="total-row"><span>${labels.discount} (${doc.discountPct}%)</span><strong>-${money(totals.discount)}</strong></div>` : ''}
      ${doc.taxPct > 0 ? `<div class="total-row"><span>${labels.tax} (${doc.taxPct}%)</span><strong>${money(totals.tax)}</strong></div>` : ''}
      <div class="grand"><span>${labels.total}</span><span>${money(totals.total)}</span></div>
      ${doc.depositPct > 0 ? `<div class="total-row"><span>${labels.deposit} (${doc.depositPct}%)</span><strong>${money(totals.deposit)}</strong></div><div class="balance"><span>${labels.balance}</span><span>${money(totals.balance)}</span></div>` : ''}
    </div>
  </section>
  <footer class="footer"><span>${esc(business.email || business.phone || '')}</span><span>${esc(business.taxId || '')}</span></footer>
</main></body></html>`;
}
