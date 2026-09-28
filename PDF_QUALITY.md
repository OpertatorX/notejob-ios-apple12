# OX Invoice PDF quality specification

PDF output is a core feature of OX Invoice, not an afterthought.

## Rendering rules

- True A4 page layout
- 16 mm top/bottom and 17 mm left/right print margins
- HTML values are escaped before rendering
- Business logo is embedded directly in the document
- Table rows avoid splitting across pages
- Table headers repeat on continuation pages
- Totals/notes/footer avoid awkward page splits
- Long invoices flow naturally over multiple pages
- Currency and locale formatting follow the business settings
- Clean share filenames such as `INV-0001.pdf`

## Templates

### Classic
Clean business document with a restrained header and neutral table treatment.

### Modern
Full-width branded header using the business accent color, while keeping the body print-friendly.

### Minimal
Low-ink document with reduced visual chrome and simple table rules.

## Internal render QA performed

The template engine has been exercised with:

- one-page Classic invoice
- one-page Modern invoice
- one-page Minimal invoice
- a long 30-line multi-page document

The long document rendered to 3 pages with repeated table headings and clean totals/notes on the final page. Rendered PNGs were visually inspected after generation and PDF preflight found no encryption, XFA, scanning-only content or structural corruption.

## Final parity check before App Store release

Because the production app uses iOS `expo-print`, the final build should still perform one physical-device export for each template and visually compare it to the expected A4 layout before submission. This verifies Apple's WebKit print renderer in the exact shipped binary.
