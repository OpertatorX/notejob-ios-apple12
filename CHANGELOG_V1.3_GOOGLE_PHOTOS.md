# V1.3 — Google Places photos

- Google Places photo fallback added after NoteJob manual media.
- Exact establishment matching uses company name + street address + postal code + city.
- A private Supabase Edge Function (`place-photo`) proxies Google Places so the Google API key never ships in the app.
- Only the Google Place ID is persisted server-side; photo references/URIs are refreshed when needed.
- Google Maps and photo author attribution are rendered over Google-sourced imagery.
- Manual SIRET/SIREN media still has priority, so Media Manager overrides remain possible.
- `google_place_links` table added with RLS and no public grants.
