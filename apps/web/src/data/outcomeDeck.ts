import type { OutcomeSlug, OutcomeType } from "../types/types";
import arrayToMap from "../utils/arrayToMap";
import outcomeCsvRaw from "./outcomes-en.csv?raw";

type OutcomeCsvRow = {
  slug: string;
  title: string;
  icon: string;
  description: string;
  instructions: string;
  count: string;
  deck: string;
};

const decodeBrokenEncoding = (value: string): string =>
  value
    .replace(/\u00e2\u20ac\u201a/g, " ")
    .replace(/\u00c2/g, "")
    .replace(/&nbsp;/gi, " ");

const sanitizeRichText = (value: string): string =>
  decodeBrokenEncoding(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const normalizePublicUri = (value: string): string =>
  value.trim().replace(/^\/mighty-decks\//, "/");

const parseCsv = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseOutcomeCsvRows = (csv: string): OutcomeCsvRow[] => {
  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((value) => value.trim());

  return dataRows.map((dataRow) => {
    const record: Partial<OutcomeCsvRow> = {};
    headers.forEach((header, headerIndex) => {
      const rawValue = dataRow[headerIndex] ?? "";
      const key = header as keyof OutcomeCsvRow;
      record[key] = rawValue.trim();
    });

    return {
      slug: record.slug ?? "",
      title: record.title ?? "",
      icon: record.icon ?? "",
      description: record.description ?? "",
      instructions: record.instructions ?? "",
      count: record.count ?? "1",
      deck: record.deck ?? "base",
    };
  });
};

const toOutcomeTypeWithCount = (
  row: OutcomeCsvRow,
): (OutcomeType & { count: number }) | null => {
  const normalizedSlug = row.slug.trim().toLowerCase();
  if (
    normalizedSlug !== "special" &&
    normalizedSlug !== "success" &&
    normalizedSlug !== "partial" &&
    normalizedSlug !== "fumble" &&
    normalizedSlug !== "chaos"
  ) {
    return null;
  }

  const parsedCount = Number.parseInt(row.count, 10);

  return {
    slug: normalizedSlug,
    deck: row.deck.trim(),
    title: sanitizeRichText(row.title),
    iconUri: normalizePublicUri(row.icon),
    description: sanitizeRichText(row.description),
    instructions: sanitizeRichText(row.instructions),
    count: Number.isFinite(parsedCount) ? parsedCount : 1,
  };
};

const outcomeRows = parseOutcomeCsvRows(outcomeCsvRaw);
const outcomeRecords = outcomeRows
  .map(toOutcomeTypeWithCount)
  .filter(
    (value): value is OutcomeType & { count: number } =>
      value !== null && value.slug.length > 0,
  );

export const outcomeMap = arrayToMap(outcomeRecords, "slug") as {
  [key in OutcomeSlug]: OutcomeType & { count: number };
};

export const { special, success, partial, fumble, chaos } = outcomeMap;

const outcomes = [
  special,
  success,
  success,
  success,
  partial,
  partial,
  partial,
  fumble,
  fumble,
  fumble,
  fumble,
  chaos,
].map((outcome, outcomeIndex) => ({
  ...outcome,
  slug: `${outcome.slug}-${outcomeIndex}`,
}));

export default outcomes;