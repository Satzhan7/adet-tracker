# Әдет трекер — жұмыс тізімі

## 0-кезең. Негіз

- [x] `git init` жоба папкасында (бөлек репо, home-dir репосынан тәуелсіз)
- [x] `.gitignore`: `.env*`, `node_modules`, `.next`, zip, `adet-tracker-handoff/data/` (жеке деректер)
- [x] Next.js 16.4 (App Router, Cache Components) + TypeScript + Tailwind 4 + ESLint, `src/`
- [x] `@supabase/ssr`; server/browser клиенттері, `src/proxy.ts` (Next 16: middleware → proxy)
- [x] Supabase жобасы `adet-tracker` (hxfmukdgfyobxpkicwbu), кілттер → `.env.local`
- [x] Миграция `supabase/migrations/20261126000000_init.sql` қолданылды:
  - enum-дар: parz_status, nafl_status, witr_status, dhikr_status, creatine_status, protein_status, fast_status
  - кестелер: profiles, days, notes, khatm_log, hifz_log, imports
  - `allowed_emails` кестесі + `before insert on auth.users` триггері (allowlist-те жоқ email тіркелмейді)
  - `handle_new_user` → profiles жолы
  - RLS барлық кестеде: `user_id = auth.uid()`
  - SPEC-тен ауытқу (дизайн бойынша): `wird` → `wird_taha` + `wird_amana` (оқыдым/ішінара/жоқ); `hifz_log.date` nullable
- [x] Auth коды: Google OAuth + email magic link, `/login`, `/auth/callback`, `/auth/signout`
- [x] Бос қорғалған басты бет (аты + email + «Шығу»)
- [x] Тексеру (API): allowlist, RLS — 11/11 PASS; build + lint таза; `/` → 307 `/login`
- [x] Allowlist-ке Сатжанның email-і
- [x] GitHub `Satzhan7/adet-tracker` (PUBLIC болған → private етілді) → Vercel `adet-tracker`, env, git auto-deploy
- [x] Supabase Auth: Site URL `https://adet-tracker.vercel.app` + Redirect URLs (prod, preview wildcard, localhost)
- [x] Кіру (`/login`) және тіркелу (`/register`) беттері ортаға келтірілген бір карточка (пайдаланушы референсі бойынша): ортақ `AuthShell` + `AuthForm`
  - кіру `shouldCreateUser: false` (тіркелмеген email → «Тіркелу» сілтемесі); тіркелу аты → `full_name` → profiles.name
  - allowlist өзгеріссіз; proxy `/register`-ді ашық етеді, кірген қолданушыны `/`-ге жібереді
  - Тексеру: build + lint таза; браузерде 1440/375, allowlist қатесі, тіркелмеген email қатесі, `?error=` хабарлары
- [x] Репо қайта PUBLIC етілді (Vercel Hobby: команда мүшесі емес автордың коммиттері блокталады); тарихта құпия кілттер жоқ, тексерілді
- [ ] Google OAuth client (Сатжан Google Cloud-та) → Supabase provider
- [ ] Тексеру: preview-де нақты кіру (magic link + Google)
