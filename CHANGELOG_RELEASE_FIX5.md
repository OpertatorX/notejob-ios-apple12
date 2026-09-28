# NoteJob Release Automation FIX5

- Vercel deployment parsing now prefers the explicit Production URL.
- Added `site/vercel.json` with clean URLs and an explicit text/plain header for `/app-ads.txt`.
- Public `app-ads.txt` verification now uses curl status/body files and never dumps a full HTML error page into PowerShell/chat.
- Attempts to disable SSO deployment protection on the dedicated `operatorx-notejob` project before the public verification; the authoritative gate remains the unauthenticated public HTTP check.
- Keeps the Windows PowerShell 5.1 UTF-8 BOM compatibility fix and the FIX4 native-process exit-code handling.
