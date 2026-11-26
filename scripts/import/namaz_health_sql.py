import sys, json
d = json.load(open(sys.argv[1]))
q = lambda v: "null" if v is None else "'" + str(v).replace("'", "''") + "'"
T = {"tan": "fard_status", "besin": "fard_status", "asr": "fard_status", "sham": "fard_status", "quptan": "fard_status",
     "utir": "witr_status", "tungi": "nafl_status", "duha": "nafl_status",
     "creatine": "creatine_status", "protein": "protein_status", "oraza": "fast_status"}
F = list(T)
out = ["begin;", """do $$ begin
  if (select count(*) from auth.users) <> 1 then raise exception 'expected exactly one user'; end if;
  if exists (select 1 from public.khatm_log where date < '2025-01-01') then raise exception 'khatm 2024 already imported'; end if;
end $$;""", "create temp table imp_user on commit drop as select id from auth.users;"]
rows = ",\n".join(f"({q(r['date'])}::date, " + ", ".join(f"{q(r.get(f))}::public.{T[f]}" for f in F) + ")" for r in d["days"])
out.append(f"insert into public.days (user_id, date, {', '.join(F)})\nselect (select id from imp_user), v.* from (values\n{rows}\n) as v(date, {', '.join(F)})\non conflict (user_id, date) do update set\n" + ",\n".join(f"  {f} = coalesce(public.days.{f}, excluded.{f})" for f in F) + ";")
rows = ",\n".join(f"({q(e['date'])}::date, {e['pages']}, {e['from_page']}, {e['to_page']})" for e in d["khatm"])
out.append(f"insert into public.khatm_log (user_id, date, pages, from_page, to_page)\nselect (select id from imp_user), v.* from (values\n{rows}\n) as v(date, pages, from_page, to_page) order by v.date;")
out.append("insert into public.imports (user_id, file_name, rows_ok, rows_err, errors)\nselect id, %s, %d, %d, %s::jsonb from imp_user;" % (
    q("Жәннәт бақшасы 2025/2026, Креатин_Протеин, 2024 Quran"), len(d["days"]) + len(d["khatm"]), len(d["problems"]), q(json.dumps(d["problems"], ensure_ascii=False))))
out.append("commit;")
open(sys.argv[2], "w").write("\n\n".join(out) + "\n")
