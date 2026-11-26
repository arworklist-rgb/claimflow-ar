# ClaimFlow AR — clickable demo

Front-end-only demo of a claim denial workflow SaaS for US medical billing teams.
There is no backend: all state lives in the browser (Zustand + `localStorage`).
Use **avatar menu → Reset demo data** to restore the seed data.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (type-checked)
pnpm start        # serve the production build
pnpm lint
```

## Screens

| Route | What it does |
| --- | --- |
| `/upload-claims` | New Worklist + Paid Claim uploads (SheetJS parsing, preview, validation, green-header templates, "Try with a sample file"), recent uploads. The New Claims card has a **Billing Software** dropdown: the expected columns, their names, validation, preview and the downloaded template all follow the chosen software (changing it clears the picked file). A repeated Claim No (same practice) updates the claim ("X new, Y updated"). Paid files match on Patient Name + Service date and show a result summary |
| `/worklist` | Aging buckets, summary cards, filters (Responsible, Action, Submitted Status, Assigned to, Denial Code). Action, Submitted Status, Denial Codes, Paid Amount and Transaction By are edited in the table; Patient Name and Claim No are pinned left and the edit icon is pinned right. The pencil opens a centered edit popup (unsaved changes ask "Discard changes?"). AR 1 / AR 2 are read-only here; admins reassign them in the popup. The header row is frozen (sticky) while the table scrolls. The **AR / Team** column shows who uploaded the claim (AR 1, plus AR 2 when a later upload updated it). Columns between Claim No and Denial Code come from Settings; the toolbar has a template-download menu and an Export worklist button whose Excel columns follow the same Settings (names, order, custom fields) |
| `/settings/upload-templates` | Admin-only editor with three tabs. **Software templates**: per billing software, the Excel columns in order (name, "also accepts" aliases, the worklist field each maps to, required, order), add/remove software, download the template. **Worklist columns**: name, field shown, on/off and order of the worklist columns. **Custom fields**: extra fields (text, number, date, ...) that can be used in templates and worklist columns |
| `/helpdesk` | Contact cards for payers, clearinghouses, practices and teammates: phone numbers with copy buttons, email, portal link, hours, notes. Admins add, edit and delete |
| `/knowledge-center` | Document library (Word, Excel, CSV, PDF up to 10 MB, several files at once). Files live in IndexedDB; preview Excel/CSV with SheetJS, .docx with mammoth, PDF in an iframe. Admins or the uploader can edit and delete |
| `/settings/practices` | Practices + Users tabs, add/edit/delete, assigned-user sheet |
| `/settings/denial-codes` | The client's 116 denial codes (from `Denial codes.xlsx`), natural code order, add / edit / deactivate / delete and Excel or CSV import (two columns, header optional) for admins; read-only for everyone else. `/settings/denial-reasons` redirects here |
| everything else | "Planned for the next phase" placeholders |

## Structure

```
src/app                 routes (App Router)
src/components/ui       shadcn/ui primitives
src/components/shared   DataTable + useDataTable, stat cards, badges, dialogs
src/components/upload   FileDropzone + upload hook, claim cards
src/components/{layout,practices,denial-reasons,worklist}
src/lib/store           persisted Zustand store (skipHydration + manual rehydrate)
src/lib/mock-data       seed data
src/lib/excel           SheetJS parsing, sample/template/export builders
```

## Notes

- **Who you are is a demo switch.** The user menu's "View as" lists every active user (Admins / Staff). It decides who uploads, who is credited in history, and whether you are an admin (denial codes, HelpDesk, reassigning AR 1 / AR 2, deleting other people's documents). There is no real sign-in or server-side permission check.
- **AR 1 / AR 2 come from whoever uploads.** A new claim gets the uploader as AR 1; when a later upload updates an existing claim and the uploader isn't already AR 1, they become AR 2. The New Claims template has no AR columns (old files that still have them are ignored). The rule lives in `importNewClaims` in `src/lib/store/demo-store.ts`.
- **Upload templates are data, not code.** `softwares`, `customFields` and `worklistColumns` live in the store (seed: `src/lib/mock-data/software-templates.ts`; field helpers: `src/lib/templates.ts`). Claims keep built-in fields plus `extra[customFieldKey]`, and remember the software they were uploaded with. "Admin" is the super user; there is no server-side permission check. The Paid template is fixed.
- Denial codes aren't part of any Excel template; they are chosen inside the app (`src/lib/mock-data/denial-codes.ts` is the seed, generated from the client's file).
- Knowledge Center files are stored with `idb-keyval` (IndexedDB); only metadata is in the persisted store. The sample documents are generated in the browser on first visit.
- The Paid Claim template is `Patient Acct No | Patient Name | Service date | Payment Date | Transaction By | Paid Amount`; every row is treated as paid. To change how rows are matched to the worklist, edit `claimsForPaidRow` in `src/lib/claims.ts`.
- `exceljs` is used only to write the styled (green-header) templates and samples; SheetJS does the reading. Both are loaded on demand.
- The persisted store is versioned (`claimflow-ar-demo`, v6); older saves are migrated in place (see `upgradeClaim` in `src/lib/store/demo-store.ts`).
- `xlsx` is installed from the SheetJS CDN tarball (the npm registry copy is abandoned and has known advisories).
- TypeScript is pinned to 6.x because `typescript-eslint` does not support 7 yet.
