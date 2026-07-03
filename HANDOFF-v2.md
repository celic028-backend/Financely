# Financely v2 — handoff (šta ti treba da uradiš)

Sav kod je napisan i build prolazi (`npm run build`). Ostaju koraci na Supabase
strani koje ne mogu iz koda (deploy + tajni ključevi + migracije). Bez njih,
glas/AI/push stoje neaktivni sa jasnom porukom — ostatak app-a radi.

## 1. Migracije (Supabase SQL editor ili `supabase db push`)

Primeni redom (idempotentne su, bezbedno i ako su delovi već tu):

- `supabase/migrations/0010_savings_goal_mode.sql` — kolone `mode/rate/fixed_amount` (štednja)
- `supabase/migrations/0011_profile_notifications.sql` — `notify_*` kolone
- `supabase/migrations/0012_push_subscriptions.sql` — tabela + RLS
- `supabase/migrations/0013_realtime.sql` — uključi Realtime za 6 tabela

## 2. Edge funkcije (deploy)

```bash
supabase functions deploy chat          # AI asistent (Claude)
supabase functions deploy transcribe    # glas → tekst
supabase functions deploy notify --no-verify-jwt   # push (poziva ga cron)
```

## 3. Tajni ključevi (Supabase → Edge Functions → Secrets)

| Ključ | Za šta | Gde nabaviti |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI asistent | console.anthropic.com |
| `GROQ_API_KEY` | glasovna transkripcija (whisper) | console.groq.com (jeftino, podržava sr) |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Web Push | `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` (opciono) | mailto za VAPID | npr. `mailto:ti@primer.com` |

`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` su automatski dostupni u edge runtime-u.

## 4. Front-end env (`.env`, pa redeploy na Vercel)

```
VITE_VAPID_PUBLIC_KEY=<isti VAPID public key>
```

Bez njega push opcija se ne prikazuje (ostalo radi).

## 5. Cron za push (jednom)

U SQL editoru: `create extension if not exists pg_cron;` i `pg_net;`
pa pokreni `supabase/cron.sql` (zameni `<PROJECT_REF>` sa `vfvnyustyhtvnrfvgwgb`).

## Provera (posle deploya)

1. **AI**: otvori Asistent, pitaj nešto → odgovor iz Claude-a (bez ključa: lokalni fallback).
2. **Glas**: „Pametni unos" → tapni mikrofon → reci „juče kafa 250" → popuni se (radi i na iPhone-u u instaliranom PWA).
3. **Push**: Podešavanja → Notifikacije → „Uključi" → dozvoli. Ručno okini: `POST .../functions/v1/notify` sa `{"kind":"daily"}`.
4. **Realtime**: dva uređaja, isti nalog → izmena vidljiva za ~1s.

## Preostalo (namerno postepeno)

- Prevod dubljih ekrana na EN (Analytics, History, Assistant, AddTransaction detalji, Recurring, CategoryManager). Skele (`i18n.ts`) i valuta su gotove; dodaje se ključ-po-ključ.
- Bankovna integracija — otvoreno pitanje.
