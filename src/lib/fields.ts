/**
 * Every daily mark the app records: its `days` column, display name and allowed values.
 * Values are the Postgres enum labels; the server action only accepts what is listed here.
 */

/** Colour family for a value: green, mosque/jumu'ah purple, made-up teal, partial, red. */
export type Tone = "good" | "mosque" | "made_up" | "partial" | "bad";

export type FieldOption = { value: string; label: string; tone: Tone };
export type FieldDef = { field: DayField; name: string; options: FieldOption[] };

const FARD: FieldOption[] = [
  { value: "уақытында", label: "Уақытында", tone: "good" },
  { value: "мешітте", label: "Мешітте", tone: "mosque" },
  { value: "қаза", label: "Қаза", tone: "bad" },
  { value: "өтелді", label: "Өтелді", tone: "made_up" },
];
const WITR: FieldOption[] = [
  { value: "уақытында", label: "Оқылды", tone: "good" },
  { value: "қаза", label: "Қаза", tone: "bad" },
  { value: "өтелді", label: "Өтелді", tone: "made_up" },
];
const NAFL: FieldOption[] = [
  { value: "оқылды", label: "Оқылды", tone: "good" },
  { value: "оқылмады", label: "Оқылмады", tone: "bad" },
];
const DHIKR: FieldOption[] = [
  { value: "орындалды", label: "Орындалды", tone: "good" },
  { value: "ішінара", label: "Ішінара", tone: "partial" },
  { value: "жоқ", label: "Жоқ", tone: "bad" },
];
const WIRD: FieldOption[] = [
  { value: "оқыдым", label: "Оқыдым", tone: "good" },
  { value: "ішінара", label: "Ішінара", tone: "partial" },
  { value: "жоқ", label: "Жоқ", tone: "bad" },
];

export const FARD_FIELDS = ["tan", "besin", "asr", "sham", "quptan"] as const;

export const FIELDS = {
  tan: { field: "tan", name: "Таң", options: FARD },
  besin: { field: "besin", name: "Бесін", options: FARD },
  asr: { field: "asr", name: "Аср", options: FARD },
  sham: { field: "sham", name: "Шам", options: FARD },
  quptan: { field: "quptan", name: "Құптан", options: FARD },
  utir: { field: "utir", name: "Үтір", options: WITR },
  tungi: { field: "tungi", name: "Түнгі намаз", options: NAFL },
  duha: { field: "duha", name: "Духа", options: NAFL },
  dhikr_morning: { field: "dhikr_morning", name: "Таңғы зікір", options: DHIKR },
  dhikr_evening: { field: "dhikr_evening", name: "Кешкі зікір", options: DHIKR },
  wird_taha: { field: "wird_taha", name: "Тоһа · таңда", options: WIRD },
  wird_amana: { field: "wird_amana", name: "Әмәнәр расул · шамнан кейін", options: WIRD },
} as const satisfies Record<string, { field: string; name: string; options: FieldOption[] }>;

export type DayField = keyof typeof FIELDS;
export type DayRow = { date: string } & Partial<Record<DayField, string | null>>;

export function isDayField(f: string): f is DayField {
  return Object.hasOwn(FIELDS, f);
}

export function optionFor(field: DayField, value: string | null | undefined): FieldOption | undefined {
  return value ? FIELDS[field].options.find((o) => o.value === value) : undefined;
}

/** Grid colours and symbols (SPEC: symbols back up colour for colour-blind users). */
export const TONE_STYLE: Record<Tone | "none", { bg: string; ink: string; mark: string }> = {
  good: { bg: "#22c55e", ink: "#ffffff", mark: "✓" },
  mosque: { bg: "#7843e9", ink: "#ffffff", mark: "◆" },
  made_up: { bg: "#0e9aa7", ink: "#ffffff", mark: "↺" },
  partial: { bg: "#d97706", ink: "#ffffff", mark: "½" },
  bad: { bg: "#be0a0a", ink: "#ffffff", mark: "✕" },
  none: { bg: "#f3f3f3", ink: "#8e8e93", mark: "" },
};

/** Dot colour in the "today" picker and its dialog. */
export const TONE_DOT: Record<Tone, string> = {
  good: "#197d19",
  mosque: "#7843e9",
  made_up: "#0e9aa7",
  partial: "#d97706",
  bad: "#be0a0a",
};
