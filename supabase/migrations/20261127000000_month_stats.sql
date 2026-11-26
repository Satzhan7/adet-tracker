-- SPEC «Есептеу ережелері»: monthly figures computed in the database.
-- security_invoker = true: the view runs with the caller's rights, so RLS on `days`
-- still limits every user to their own rows.

create or replace view public.month_stats
with (security_invoker = true)
as
with fard as (
  select d.user_id, date_trunc('month', d.date)::date as month, v
  from public.days d
  cross join lateral (values (d.tan), (d.besin), (d.asr), (d.sham), (d.quptan)) as f(v)
)
select
  m.user_id,
  m.month,
  -- rule 1: on time = уақытында + мешітте over marked fard cells
  f.on_time                                                     as fard_on_time,
  f.marked                                                      as fard_marked,
  round(100.0 * f.on_time / nullif(f.marked, 0), 2)             as fard_on_time_pct,
  -- rule 2: missed = қаза + өтелді
  f.qaza + f.made_up                                            as fard_missed,
  f.made_up                                                     as fard_made_up,
  m.witr_qaza + m.witr_made_up                                  as witr_missed,
  m.witr_made_up,
  -- rules 4–6: only marked days count; ішінара is not done
  m.dhikr_morning_done, m.dhikr_morning_marked,
  round(100.0 * m.dhikr_morning_done / nullif(m.dhikr_morning_marked, 0), 2) as dhikr_morning_pct,
  m.dhikr_evening_done, m.dhikr_evening_marked,
  round(100.0 * m.dhikr_evening_done / nullif(m.dhikr_evening_marked, 0), 2) as dhikr_evening_pct,
  -- rule 5: all three creatine doses count
  m.creatine_done, m.creatine_marked,
  round(100.0 * m.creatine_done / nullif(m.creatine_marked, 0), 2) as creatine_pct,
  m.protein_done, m.protein_marked,
  m.fard_days_marked,
  m.fasted, m.fast_qaza, m.fast_made_up
from (
  select
    user_id,
    date_trunc('month', date)::date as month,
    count(*) filter (where utir = 'қаза')                          as witr_qaza,
    count(*) filter (where utir = 'өтелді')                        as witr_made_up,
    count(*) filter (where dhikr_morning = 'орындалды')            as dhikr_morning_done,
    count(dhikr_morning)                                           as dhikr_morning_marked,
    count(*) filter (where dhikr_evening = 'орындалды')            as dhikr_evening_done,
    count(dhikr_evening)                                           as dhikr_evening_marked,
    count(*) filter (where creatine in ('5 г', '6 капсула', '3 капсула')) as creatine_done,
    count(creatine)                                                as creatine_marked,
    count(*) filter (where protein = 'іштім')                      as protein_done,
    count(protein)                                                 as protein_marked,
    count(*) filter (where coalesce(tan, besin, asr, sham, quptan) is not null) as fard_days_marked,
    count(*) filter (where oraza = 'ұстадым')                      as fasted,
    count(*) filter (where oraza = 'қаза болды')                   as fast_qaza,
    count(*) filter (where oraza = 'қаза өтедім')                  as fast_made_up
  from public.days
  group by user_id, date_trunc('month', date)
) m
join (
  select user_id, month,
         count(*) filter (where v in ('уақытында', 'мешітте')) as on_time,
         count(v)                                              as marked,
         count(*) filter (where v = 'қаза')                    as qaza,
         count(*) filter (where v = 'өтелді')                  as made_up
  from fard
  group by user_id, month
) f using (user_id, month);

comment on view public.month_stats is 'Monthly habit figures per user (SPEC calculation rules 1-6). RLS of days applies (security_invoker).';
