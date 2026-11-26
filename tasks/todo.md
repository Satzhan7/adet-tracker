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
- [x] Кіру email + құпиясөзбен (бір реттік сілтеме орнына): `/login`, `/register`, `/forgot-password`, `/update-password`; callback `?next=` қолдайды
- [ ] Сатжан: «Ұмыттыңыз ба?» арқылы бір рет құпиясөз орнату (бұрынғы аккаунтта құпиясөз жоқ)
- [ ] Google OAuth client (Сатжан Google Cloud-та) → Supabase provider
- [ ] Тексеру: preview-де нақты кіру (magic link + Google)

## 2-кезең. Дизайн жүйесі және қабық

Дереккөз: `adet-tracker-handoff/design/Main-v2*.dc.html` (theme объектісі `t`, `.side`, `.main`, breakpoints).

- [x] **Токендер** (`globals.css`): `[data-theme="dark"|"light"]` CSS айнымалылары canvas `t`-дан — body, page, text, title, side, div, avatar, btn/btnBorder/btnText; панель #e0e1e3 (ашықта ақ + #b8c4d6 шеті + көлеңке), бөлім тақырыбы #ff6a00 (ашықта #fff3ea / #b93f0a), күй түстері (жасыл/қызыл/теал/күлгін/сұр)
- [x] **Тақырып ауыстыру**: `<head>`-тағы кішкене скрипт localStorage-тен оқиды (жыпылықтамайды), батырма бүйір панельде; таңдау `profiles.theme`-ке де сақталады (басқа құрылғыда да сол тақырып; профильдегі мән басым)
- [x] **Батырмалар**: primary (күлгін градиент), secondary (екі тақырыпқа), сегмент-таб (Қараша / 2026 жыл стилі), барлығы ≥44px
- [x] **Қабық** `src/app/(app)/layout.tsx`: сол жақ бүйір панель 268px — логотип + «Әдет трекер / 2026», тақырып батырмасы; навигация 8 бет (Басты бет, Ай кестесі, Намаз, Зікір, Құран, Денсаулық, Ораза, Есептер) canvas иконкаларымен, белсенді бет күлгін; төменде профиль (аты, бас әріп) + «Шығу»
- [x] **Drawer** ≤1024px: ☰ батырмасы, сол жақтан шығады, қараңғы фон (scrim), Esc/фон басқанда жабылады, бет ауысқанда жабылады
- [x] **Бет жақтауы**: `.main` (#272d45, radius 16, padding 24; телефонда 16/12), `PageHeader` (h1 24px + түсініктеме + оң жақ әрекеттер), `Section` (қызғылт тақырыпты панель), `Tile` (KPI карточка) — 3–5 кезеңдер осыларды қолданады
- [x] **8 бет-бос орын**: әр бөлім ашылады, ішінде «N-кезеңде толады» жазуы; қазіргі «Сәлем» беті `(app)/page.tsx`-ке көшеді
- [x] **Тексеру**: 1440 / 900 / 390 скриншоттары canvas-пен қатар; lint + build; қос тақырып

Ескерту: логинмен нақты тексеру жоқ (локал тексеру уақытша proxy айналымымен, коммитке кірмеді) — preview-де өзіңіз тексеріңіз.

Әдейі кейінге қалдырылады: «+» жылдам енгізу батырмасы мен «30 қаза» бейджі — деректер керек (1 және 3-кезеңдер).

## 5-кезең (бір бөлігі). Намаз, Зікір, Құран беттері

Дереккөз: `Namaz-v2`, `Zikir-v2`, `Quran-v2` canvas. Үшеуі бір үлгі: Бүгін → ай KPI → соңғы N күн кестесі → жылдық тренд → ең жақсы/нашар ай.
Деректер әлі импортталмаған (1-кезең), сондықтан бос күйлер дұрыс көрінуі керек; «Бүгін» блогы деректі бірден жаза бастайды.

- [x] `src/lib/dates.ts`: Asia/Almaty бойынша бүгін, ай атаулары (қазақша), күн аралықтары
- [x] `src/lib/stats.ts` + vitest тесттері: SPEC «Есептеу ережелері» 1–9 (тек белгіленген күндер, серия, ең жақсы/нашар ай ≥10 күн)
- [x] Server actions: `setDayStatus(date, field, value|null)` (өріс + мән whitelist), `addKhatm`, `addHifz`; `refresh()`
- [x] Ортақ компоненттер: `TodayPicker` (шеңберлер + диалог, «Белгіні алып тастау»), `DayGrid` (7/10/14/30 чиптері, ✓ ✕ ↺ ◆ белгілері), `TrendChart` (айлық бағаналар), `BestWorst`, `Tile` tone + қызғылт жолақ, телефонда жиналатын бөлімдер
- [x] `/namaz`: 8 намаз бүгін; KPI — парыз уақытында %, қаза (өтелді), мешітте, түнгі, духа, ең әлсіз намаз; қаза есебі; кесте; тренд; ең жақсы/нашар
- [x] `/zikir`: таңғы/кешкі; KPI — ай %, соңғы орындалған күн, ең ұзақ серия; кесте; 2 сериялы тренд; ең жақсы/нашар
- [x] `/quran`: Хатм / Хифз / Уирд табтары; хатм беттерін, хифз жазбасын енгізу; уирд days-та
- [x] Тексеру: lint, build, vitest 17/17; 1440/375 локалда; бос күй; RLS аноним жазуды бұғаттайды
- [x] Өткен күндерді белгілеу/түзету: «Белгілеу» панелінде күн ауыстырғыш (‹ › күнтізбе, болашаққа тыйым — UI және server), кестенің әр ұяшығы батырма; хатм/хифз формаларында «Күн» өрісі
- [x] Preview-де логинмен (Chrome): Таң 25 қараша (кестеден) қаза → KPI 0/1 → өшірілді; Кешкі зікір 25 қараша (күн ауыстырғыштан) ішінара → кесте сәйкес → өшірілді; Тоһа бүгін → 100% → өшірілді; хатм 24 қараша 2 бет қосылып өшірілді; хифз «Тест сүре» қосылып өшірілді. Нақты деректер өзгеріссіз
- [x] Server action кезіндегі `Date.now()` prerender қатесі: server Supabase клиентіне `await connection()` — жаңа деплойда лог таза
- [ ] Алғашқы тестте сессия ~1 минуттан кейін түсті; қайта тексергенде (~5 мин, барлық әрекет) қайталанбады. Токен 1 сағ, refresh себеп емес. Ықтимал себеп: басқа жерде «Шығу» (Supabase signOut әдепкі `global` — барлық құрылғыдан шығарады)

SPEC-тен ауытқу: пайыздар әзірге TS-те (`src/lib/stats.ts`) есептеледі; `month_stats` SQL view 1-кезеңде.
