import type { AppData, BusinessProfile, DocumentKind, DocumentTotals, QuoteDocument, SavedService } from './types';

export const FREE_DOCUMENT_LIMIT = 3;

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function calculateTotals(doc: Pick<QuoteDocument, 'items' | 'discountPct' | 'taxPct' | 'depositPct'>): DocumentTotals {
  const subtotal = round2(doc.items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rate), 0));
  const discount = round2(subtotal * clampPct(doc.discountPct) / 100);
  const afterDiscount = round2(subtotal - discount);
  const tax = round2(afterDiscount * clampPct(doc.taxPct) / 100);
  const total = round2(afterDiscount + tax);
  const deposit = round2(total * clampPct(doc.depositPct) / 100);
  const balance = round2(total - deposit);
  return { subtotal, discount, afterDiscount, tax, total, deposit, balance };
}

export function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
export function clampPct(n: number): number { return Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)); }

export function formatMoney(value: number, currency: string, locale: string): string {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

export function nextDocumentNumber(kind: DocumentKind, docs: QuoteDocument[], nextSequence?: number): string {
  const prefix = kind === 'invoice' ? 'INV' : 'EST';
  const max = docs
    .filter(d => d.kind === kind)
    .map(d => Number((d.number.match(/(\d+)$/)?.[1] ?? '0')))
    .reduce((a, b) => Math.max(a, b), 0);
  const sequence = Math.max(max + 1, Math.max(1, Number(nextSequence ?? 1)));
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

function defaultLocale(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US'; }
  catch { return 'en-US'; }
}

export function blankBusiness(): BusinessProfile {
  const locale = defaultLocale().toLowerCase();
  const language = locale.startsWith('fr') ? 'fr' : 'en';
  const currency = locale.startsWith('fr') ? 'EUR' : 'USD';
  return {
    name: '', email: '', phone: '', address: '', taxId: '', website: '', paymentDetails: '', logoDataUri: null,
    currency, defaultTaxPct: 0, language, pdfTemplate: 'classic', accent: '#0A2540',
  };
}

export function initialData(): AppData {
  return {
    schemaVersion: 3,
    business: blankBusiness(),
    clients: [],
    services: [],
    documents: [],
    freeDocumentsCreated: 0,
    counters: { estimate: 1, invoice: 1 },
    proEntitled: false,
    entitlementCheckedAt: null,
  };
}

export function canCreateDocument(data: Pick<AppData, 'proEntitled' | 'freeDocumentsCreated'>): boolean {
  return data.proEntitled || data.freeDocumentsCreated < FREE_DOCUMENT_LIMIT;
}

export function resetBusinessData(data: Pick<AppData, 'freeDocumentsCreated' | 'proEntitled' | 'entitlementCheckedAt'>): AppData {
  const fresh = initialData();
  return {
    ...fresh,
    freeDocumentsCreated: Math.max(0, Number(data.freeDocumentsCreated || 0)),
    proEntitled: Boolean(data.proEntitled),
    entitlementCheckedAt: data.entitlementCheckedAt ?? null,
  };
}

export function effectiveStatus(doc: QuoteDocument, today = isoDate()): QuoteDocument['status'] {
  if (doc.status === 'paid' || doc.status === 'accepted' || doc.status === 'draft') return doc.status;
  if (doc.kind === 'invoice' && doc.dueDate && doc.dueDate < today) return 'overdue';
  return doc.status;
}


function inferServices(docs: QuoteDocument[]): SavedService[] {
  const seen = new Map<string, SavedService>();
  const sorted = [...docs].sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
  for (const doc of sorted) {
    for (const item of doc.items) {
      const title=item.title.trim();
      if (!title) continue;
      const details=item.details.trim();
      const rate=Math.max(0,Number(item.rate)||0);
      const key=`${title.toLowerCase()}|${details.toLowerCase()}|${rate.toFixed(2)}`;
      const previous=seen.get(key);
      const stamp=doc.updatedAt || doc.createdAt || new Date().toISOString();
      seen.set(key, previous ? {...previous, updatedAt:stamp} : {id:uid('service'),title,details,rate,createdAt:stamp,updatedAt:stamp});
    }
  }
  return [...seen.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}

function inferNextSequence(kind: DocumentKind, docs: QuoteDocument[]): number {
  return docs.filter(d => d.kind === kind).reduce((max, d) => Math.max(max, Number(d.number.match(/(\d+)$/)?.[1] ?? 0)), 0) + 1;
}

export function sanitizeLoadedData(raw: unknown): AppData {
  const base = initialData();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Partial<AppData>;
  return {
    ...base,
    ...value,
    schemaVersion: 3,
    business: { ...base.business, ...(value.business ?? {}) },
    clients: Array.isArray(value.clients) ? value.clients : [],
    services: Array.isArray(value.services) ? value.services : inferServices(Array.isArray(value.documents) ? value.documents : []),
    documents: Array.isArray(value.documents) ? value.documents : [],
    freeDocumentsCreated: Math.max(0, Number(value.freeDocumentsCreated ?? 0)),
    counters: {
      estimate: Math.max(1, Number(value.counters?.estimate ?? inferNextSequence('estimate', Array.isArray(value.documents) ? value.documents : []))),
      invoice: Math.max(1, Number(value.counters?.invoice ?? inferNextSequence('invoice', Array.isArray(value.documents) ? value.documents : []))),
    },
    proEntitled: Boolean(value.proEntitled),
    entitlementCheckedAt: value.entitlementCheckedAt ?? null,
  };
}
