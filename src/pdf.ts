import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { BusinessProfile, QuoteDocument } from './types';
import { buildDocumentHtml } from './pdfTemplate';

function safePdfName(number: string): string {
  const base = number.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base || 'OX Invoice-document'}.pdf`;
}

export async function createPdf(business: BusinessProfile, doc: QuoteDocument): Promise<string> {
  const html = buildDocumentHtml(business, doc, business.language);
  const result = await Print.printToFileAsync({
    html,
    width: 595.28,
    height: 841.89,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  // expo-print generates an opaque temporary filename. Copy it to a predictable,
  // professional filename so Mail, AirDrop and Files receive e.g. INV-0001.pdf.
  const source = new File(result.uri);
  const named = new File(Paths.cache, safePdfName(doc.number));
  await source.copy(named, { overwrite: true });
  return named.uri;
}

export async function sharePdf(business: BusinessProfile, doc: QuoteDocument): Promise<string> {
  const uri = await createPdf(business, doc);
  const available = await Sharing.isAvailableAsync();
  if (!available) return uri;
  await Sharing.shareAsync(uri, {
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf',
    dialogTitle: safePdfName(doc.number),
  });
  return uri;
}
