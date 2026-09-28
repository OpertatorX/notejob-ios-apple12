export type Language = 'fr' | 'en';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';
export type DocumentKind = 'estimate' | 'invoice';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'overdue';
export type PdfTemplate = 'classic' | 'modern' | 'minimal';

export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  website: string;
  paymentDetails: string;
  logoDataUri: string | null;
  currency: Currency;
  defaultTaxPct: number;
  language: Language;
  pdfTemplate: PdfTemplate;
  accent: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  title: string;
  details: string;
  quantity: number;
  rate: number;
}

export interface SavedService {
  id: string;
  title: string;
  details: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSnapshot {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface QuoteDocument {
  id: string;
  kind: DocumentKind;
  number: string;
  clientId: string | null;
  client: ClientSnapshot;
  items: LineItem[];
  discountPct: number;
  taxPct: number;
  depositPct: number;
  issueDate: string;
  dueDate: string;
  notes: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  schemaVersion: 3;
  business: BusinessProfile;
  clients: Client[];
  services: SavedService[];
  documents: QuoteDocument[];
  freeDocumentsCreated: number;
  counters: { estimate: number; invoice: number };
  proEntitled: boolean;
  entitlementCheckedAt: string | null;
}

export interface DocumentTotals {
  subtotal: number;
  discount: number;
  afterDiscount: number;
  tax: number;
  total: number;
  deposit: number;
  balance: number;
}
