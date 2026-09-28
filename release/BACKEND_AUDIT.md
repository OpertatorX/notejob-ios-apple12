# NoteJob 1.0 — Backend audit

Project Supabase: `ruyrbxlwueimtkcidbqa`

## Release state checked
- Core tables have RLS enabled: companies, establishments, ratings, establishment_reports.
- `employer-search` is ACTIVE, version 3, JWT verification enabled.
- `business-media` is ACTIVE, version 3, but the released UI does not depend on automatic company imagery.
- `place-photo` remains deployed but the released UI does not depend on it.
- Anonymous-auth rating workflow remains intentional: own-rating read/edit/delete is tied to `auth.uid()`.
- Public aggregate RPCs `company_stats` and `establishment_stats` intentionally remain callable for read-only public score display.
- `submit_rating`, `delete_my_rating`, `ensure_establishment`, and `submit_establishment_report` require an authenticated UID inside the function.

## Security hardening applied before release
The legacy media-manager bootstrap RPC `public.claim_first_media_admin()` was no longer needed by the consumer app. Execute permission was revoked from `public`, `anon`, and `authenticated`; only `service_role` retains execution. This prevents a normal client session from attempting to bootstrap media administration.

## Remaining Supabase advisor notices
- `open_photo_links` and `business_web_links`: RLS enabled with no client policies. This is intentional private/cache behavior.
- SECURITY DEFINER warnings on public aggregate stats and authenticated rating RPCs: intentional API surface, with UID checks for mutation functions.
- Anonymous-sign-in warnings: expected because NoteJob deliberately uses Supabase anonymous authentication instead of named accounts.
- Leaked-password protection warning: not a release blocker for the anonymous-only in-app account flow, but should be enabled if password-based sign-in is introduced later.
