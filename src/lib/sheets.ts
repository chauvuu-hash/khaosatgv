import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

const TABS = {
  GiangVien: "GiangVien",
  Khoa: "Khoa",
  HocVien: "HocVien",
  PhieuKhaoSat: "PhieuKhaoSat",
  DonVi: "DonVi",
} as const;

type TabName = (typeof TABS)[keyof typeof TABS];

/**
 * Anh xa ten cot thuc te tren Google Sheet (tieng Viet co dau, do nguoi dung
 * tu dat) sang ten truong noi bo code dung (khong dau). Cho phep sheet giu
 * nguyen ten cot de nguoi dung de doc, khong bat phai doi ten cot.
 */
const HEADER_MAP: Partial<Record<TabName, Record<string, string>>> = {
  GiangVien: {
    "Mã GV": "MaGV",
    "Họ tên": "HoTen",
    HoTenGV: "HoTen",
    "QTĐT phụ trách": "QTDT",
    QTDTPhuTrach: "QTDT",
  },
  Khoa: {
    "Mã lớp": "MaKhoa",
    MaLop: "MaKhoa",
    "Nội dung": "TenKhoa",
    NoiDung: "TenKhoa",
    "Loại lớp": "LoaiLop",
  },
  HocVien: {
    "Mã học viên": "MaHV",
    "Họ tên": "HoTen",
    HoTenHV: "HoTen",
    "Đơn vị": "DonVi",
    "Miền": "Mien",
    "Mã khoá": "MaKhoa",
  },
};

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

  const dungOAuth = !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  const auth = dungOAuth
    ? (() => {
        const client = new google.auth.OAuth2(
          getEnv("GOOGLE_OAUTH_CLIENT_ID"),
          getEnv("GOOGLE_OAUTH_CLIENT_SECRET")
        );
        client.setCredentials({
          refresh_token: getEnv("GOOGLE_OAUTH_REFRESH_TOKEN"),
        });
        return client;
      })()
    : new google.auth.JWT({
        email: getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        key: getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
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
  const map = HEADER_MAP[tab] ?? {};
  const rows: T[] = [];
  const rowNumbers: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i];
    if (!raw || raw.every((c) => c === undefined || c === "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[map[h] ?? h] = raw[idx] ?? "";
    });
    rows.push(obj as T);
    rowNumbers.push(i + 1);
  }
  return { headers, rows, rowNumbers };
}

/**
 * Doc tho 1 vung o (khong gan header/object) - dung cho tab co cau truc khac
 * dang "1 dong = 1 ban ghi", vd tab DonVi co 2 danh sach doc lap dat canh
 * nhau theo cot (cot DonVi va cot Mien khong cung hang voi nhau).
 */
export async function readValues(range: string): Promise<string[][]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range,
  });
  return (res.data.values ?? []) as string[][];
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

/**
 * Giong appendRows, nhung `rows` dung ten truong noi bo (vd "HoTen") thay vi
 * ten cot thuc te tren Sheet (vd "HoTenHV") - tu tra qua HEADER_MAP truoc
 * khi ghi. Dung cho tab co the co ten cot tieng Viet/khac ten truong noi bo
 * (vd HocVien), tranh ghi nham cot rong do khong khop ten.
 */
export async function appendRowsMapped(
  tab: TabName,
  rows: Record<string, string>[]
): Promise<void> {
  if (rows.length === 0) return;
  const sheets = getClient();
  const { headers } = await readTab(tab);
  const map = HEADER_MAP[tab] ?? {};
  const values = rows.map((row) =>
    headers.map((h) => row[map[h] ?? h] ?? "")
  );
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
