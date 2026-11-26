import sys, json
d = json.load(open(sys.argv[1]))
q = lambda v: "null" if v is None else "'" + str(v).replace("'", "''") + "'"
F = ["dhikr_morning", "dhikr_evening", "wird_taha", "wird_amana"]
T = {"dhikr_morning": "dhikr_status", "dhikr_evening": "dhikr_status", "wird_taha": "wird_status", "wird_amana": "wird_status"}
out = ["begin;",
"""do $$ begin
  if (select count(*) from auth.users) <> 1 then raise exception 'expected exactly one user'; end if;
  if exists (select 1 from public.khatm_log) or exists (select 1 from public.hifz_log) then
    raise exception 'khatm_log / hifz_log not empty: import already done?'; end if;
end $$;""",
"create temp table imp_user on commit drop as select id from auth.users;"]
rows = ",\n".join(f"({q(r['date'])}::date, " + ", ".join(f"{q(r.get(f))}::public.{T[f]}" for f in F) + ")" for r in d["days"])
out.append(f"""insert into public.days (user_id, date, {', '.join(F)})
select (select id from imp_user), v.* from (values
{rows}
) as v(date, {', '.join(F)})
on conflict (user_id, date) do update set
""" + ",\n".join(f"  {f} = coalesce(public.days.{f}, excluded.{f})" for f in F) + ";")
rows = ",\n".join(f"({q(e['date'])}::date, {e['pages']}, {e['from_page']}, {e['to_page']})" for e in d["khatm"])
out.append(f"""insert into public.khatm_log (user_id, date, pages, from_page, to_page)
select (select id from imp_user), v.* from (values
{rows}
) as v(date, pages, from_page, to_page) order by v.date;""")
rows = ",\n".join(f"({q(e['date'])}::date, {q(e['surah'])}, {e['repetitions']})" for e in d["hifz"])
out.append(f"""insert into public.hifz_log (user_id, date, surah, repetitions)
select (select id from imp_user), v.* from (values
{rows}
) as v(date, surah, repetitions) order by v.date;""")
out.append("""insert into public.imports (user_id, file_name, rows_ok, rows_err, errors)
select id, '2026 Quran.xlsx', %d, %d, %s::jsonb from imp_user;""" % (len(d['days'])+len(d['khatm'])+len(d['hifz']), len(d['problems']), q(json.dumps(d['problems'], ensure_ascii=False))))
out.append("commit;")
open(sys.argv[2], "w").write("\n\n".join(out) + "\n")
