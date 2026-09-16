import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

const TABS = {
  GiangVien: "GiangVien",
  Khoa: "Khoa",
  HocVien: "HocVien",
  PhieuKhaoSat: "PhieuKhaoSat",
} as const;

type TabName = (typeof TABS)[keyof typeof TABS];

let cachedClient: sheets_v4.Sheets | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thieu bien moi truong ${name}. Xem huong dan trong README de cau hinh Google Service Account / Sheet ID.`
    );
  }
  return value;
}

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = getEnv("GOOGLE_PRIVATE_KEY");
  const privateKey = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function getSheetId(): string {
  return getEnv("GOOGLE_SHEET_ID");
}

/** Doc toan bo 1 tab, tra ve header + danh sach dong dang object + so thu tu dong that (1-based, tinh ca header). */
export async function readTab<T extends Record<string, string>>(
  tab: TabName
): Promise<{ headers: string[]; rows: T[]; rowNumbers: number[] }> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1:Z10000`,
  });
  const values = res.data.values ?? [];
  if (values.length === 0) return { headers: [], rows: [], rowNumbers: [] };
  const headers = values[0] as string[];
  const rows: T[] = [];
  const rowNumbers: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i];
    if (!raw || raw.every((c) => c === undefined || c === "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = raw[idx] ?? "";
    });
    rows.push(obj as T);
    rowNumbers.push(i + 1);
  }
  return { headers, rows, rowNumbers };
}

/** Them 1 dong moi vao cuoi tab, theo dung thu tu cot cua header hien co. */
export async function appendRow(
  tab: TabName,
  row: Record<string, string>
): Promise<void> {
  const sheets = getClient();
  const { headers } = await readTab(tab);
  const values = headers.map((h) => row[h] ?? "");
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

/** Them nhieu dong cung luc (hieu qua hon appendRow lap lai nhieu lan). */
export async function appendRows(
  tab: TabName,
  rows: Record<string, string>[]
): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getClient();
  const { headers } = await readTab(tab);
  const values = rows.map((row) => headers.map((h) => row[h] ?? ""));
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

/** Cap nhat 1 dong da biet so thu tu dong that (rowNumber tra ve tu readTab). */
export async function updateRow(
  tab: TabName,
  rowNumber: number,
  headers: string[],
  row: Record<string, string>
): Promise<void> {
  const sheets = getClient();
  const values = headers.map((h) => row[h] ?? "");
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${tab}!A${rowNumber}:${colLetter(headers.length)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

function colLetter(n: number): string {
  let s = "";
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

export { TABS };
export type { TabName };
