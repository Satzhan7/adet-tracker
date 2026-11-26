import "server-only";
import ExcelJS from "exceljs";
import { MONTHS } from "./dates";
import { FIELDS, type DayField } from "./fields";
import { COLUMNS } from "./sheet-format";
import type { MonthStat } from "./data";

const ORANGE = "FFFFE7D1"; // editable cells, like the template
const HEAD = "FFFF6A00";

/**
 * Template-format workbook: «Нұсқаулық», «Күнделік» (dropdowns from «Тізімдер»),
 * «Ай қорытындысы» (values from month_stats), «Тізімдер». Re-importable as is.
 */
export async function buildWorkbook(rows: (string | number | null)[][], stats: MonthStat[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Әдет трекер";
  wb.created = new Date();

  const help = wb.addWorksheet("Нұсқаулық");
  help.columns = [{ width: 26 }, { width: 90 }];
  [
    ["Әдет трекер — деректер"],
    [],
    ["1 жол = 1 күн", "«Күнделік» парағында әр күн — бір жол. Күні: ЖЖЖЖ-АА-КК немесе КК.АА.ЖЖЖЖ."],
    ["Толтыратын ұяшықтар", "Қызғылт-сары ұяшықтарда тізімнен таңдаңыз (ашылмалы тізім). Бос ұяшық = белгіленбеген."],
    ["Хатм", "Басы мен соңы беттерін жазсаңыз, бет саны өзі есептеледі; не тек бет санын жазыңыз."],
    ["Хифз", "Сүре атауы және неше рет қайталанғаны."],
    ["Импорт", "Әдет трекер → Есептер → Импорт. Алдымен не өзгеретіні көрсетіледі, сосын растайсыз."],
    ["Ай қорытындысы", "Экспорт кезіндегі мәндер (дерекқордағы month_stats). Excel-де қайта есептелмейді."],
  ].forEach((r) => help.addRow(r));
  help.getRow(1).font = { bold: true, size: 14 };
  help.getColumn(1).font = { bold: true };

  const lists = wb.addWorksheet("Тізімдер");
  const listFields: DayField[] = ["tan", "utir", "tungi", "dhikr_morning", "wird_taha", "creatine", "protein", "oraza"];
  const listTitle: Partial<Record<DayField, string>> = { tan: "Парыз намаз", utir: "Үтір", tungi: "Нәпіл намаз", dhikr_morning: "Зікір", wird_taha: "Уирд" };
  listFields.forEach((f, i) => {
    const col = lists.getColumn(i + 1);
    col.width = 16;
    col.values = [listTitle[f] ?? FIELDS[f].name, ...FIELDS[f].options.map((o) => o.value)];
  });
  lists.getRow(1).font = { bold: true };
  const listRange: Partial<Record<DayField, string>> = {};
  const sourceOf: Record<DayField, DayField> = {
    tan: "tan", besin: "tan", asr: "tan", sham: "tan", quptan: "tan", utir: "utir", tungi: "tungi", duha: "tungi",
    dhikr_morning: "dhikr_morning", dhikr_evening: "dhikr_morning", wird_taha: "wird_taha", wird_amana: "wird_taha",
    creatine: "creatine", protein: "protein", oraza: "oraza",
  };
  listFields.forEach((f, i) => {
    const letter = String.fromCharCode(65 + i);
    listRange[f] = `'Тізімдер'!$${letter}$2:$${letter}$${FIELDS[f].options.length + 1}`;
  });

  const days = wb.addWorksheet("Күнделік", { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  days.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  rows.slice(1).forEach((r) => days.addRow(r.map((v, i) => (i === 0 && typeof v === "string" ? new Date(`${v}T00:00:00Z`) : v))));
  const head = days.getRow(1);
  head.font = { bold: true, color: { argb: "FF1B253B" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEAD } };
  head.alignment = { vertical: "middle", wrapText: true };
  head.height = 30;
  days.getColumn(1).numFmt = "yyyy-mm-dd";
  const last = Math.max(rows.length, 2);
  COLUMNS.forEach((c, i) => {
    const col = i + 1;
    for (let r = 2; r <= last; r++) {
      const cell = days.getCell(r, col);
      if (c.key !== "date") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
      if (c.key in FIELDS) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [listRange[sourceOf[c.key as DayField]]!],
          showErrorMessage: true,
          errorTitle: "Тізімнен таңдаңыз",
          error: "Бұл мән тізімде жоқ.",
        };
      } else if (c.key === "khatm_from" || c.key === "khatm_to" || c.key === "khatm_pages") {
        cell.dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [1, 604], showErrorMessage: true, error: "1–604" };
      } else if (c.key === "hifz_reps") {
        cell.dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [0, 100], showErrorMessage: true, error: "0–100" };
      }
    }
  });
  days.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const sum = wb.addWorksheet("Ай қорытындысы", { views: [{ state: "frozen", ySplit: 1 }] });
  sum.columns = [
    { header: "Ай", width: 16 },
    { header: "Парыз уақытында, %", width: 12 },
    { header: "Парыз: уақытында / белгіленген", width: 14 },
    { header: "Қаза", width: 8 },
    { header: "Өтелді", width: 8 },
    { header: "Үтір қаза", width: 9 },
    { header: "Таңғы зікір, %", width: 11 },
    { header: "Кешкі зікір, %", width: 11 },
    { header: "Креатин, %", width: 10 },
    { header: "Ораза, күн", width: 9 },
  ];
  const yearsInRows = new Set(rows.slice(1).map((r) => String(r[0]).slice(0, 7)));
  stats
    .filter((s) => yearsInRows.has(s.month))
    .forEach((s) =>
      sum.addRow([
        `${MONTHS[Number(s.month.slice(5)) - 1]} ${s.month.slice(0, 4)}`,
        s.fard_on_time_pct,
        `${s.fard_on_time} / ${s.fard_marked}`,
        s.fard_missed,
        s.fard_made_up,
        s.witr_missed,
        s.dhikr_morning_pct,
        s.dhikr_evening_pct,
        s.creatine_pct,
        s.fasted,
      ]),
    );
  sum.getRow(1).font = { bold: true };
  sum.getRow(1).alignment = { wrapText: true, vertical: "middle" };

  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 1, visibility: "visible" }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** First rows of the «Күнделік» sheet (or the first sheet) as plain values; formulas give their cached result. */
export async function readWorkbook(data: ArrayBuffer): Promise<unknown[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const ws = wb.getWorksheet("Күнделік") ?? wb.worksheets[0];
  if (!ws) return [];
  const out: unknown[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    const cells: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      const v = cell.value;
      cells[c - 1] =
        v && typeof v === "object" && !(v instanceof Date)
          ? "result" in v
            ? v.result
            : "richText" in v
              ? v.richText.map((t) => t.text).join("")
              : "text" in v
                ? v.text
                : null
          : v;
    });
    out[n - 1] = cells;
  });
  return Array.from(out, (r) => r ?? []);
}
