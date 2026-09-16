# Khao sat chat luong giang vien (ban MVP thang 9/2026)

Cong cu tam thoi cho P.NVDT, thay 4 viec dang lam thu cong: sua form khao
sat, gui khao sat qua email ngay sau buoi hoc, thong ke ty le nop phieu,
tinh KPI GV/QTDT tu dong. **Khong** phai he thong chinh thuc (viec do P.CN
lam, theo file dac ta). Pham vi da thu gon: **khong** co lich phan cong
buoi hoc tu dong — QTDT tu bam nut "Gui khao sat" ngay sau khi 1 GV day
xong 1 buoi.

## 1. Chuan bi (lam truoc khi chay duoc)

### 1.1. Tao Google Sheet lam "database"

Tao 1 Google Sheet moi, gom 4 tab (dong 1 la ten cot, dung chinh xac nhu
duoi day):

**Tab `GiangVien`**
| MaGV | HoTen | QTDT |
|---|---|---|
| GV01 | Vu Thi Hue | Phuc |
| GV02 | Doan Thi My Hanh | Phuc |
| ... | ... | ... |

Cot `QTDT` ghi ten QTDT phu trach (Phuc / Chau), dung de tinh KPI QTDT.

**Tab `Khoa`**
| MaKhoa | TenKhoa | LoaiLop |
|---|---|---|

**Tab `HocVien`**
| MaHV | HoTen | Email | DonVi | Mien | MaKhoa |
|---|---|---|---|---|---|

**Tab `PhieuKhaoSat`** — de trong, he thong tu ghi. Chi can co dong header:
```
MaPhieu	MaHV	MaKhoa	MaGV	NgayDay	NgayGui	NgayHoanThanh	Diem1	Diem2	Diem3	Diem4	Diem5	Diem6	Diem7	Diem8	Diem9	Diem10	DiemTB	TrangThai
```

### 1.2. Tao Google Service Account (tai khoan ky thuat de doc/ghi Sheet)

1. Vao https://console.cloud.google.com/ → tao 1 project moi (hoac dung
   project co san).
2. Vao **APIs & Services → Library**, tim "Google Sheets API" → bam
   **Enable**.
3. Vao **APIs & Services → Credentials** → **Create Credentials → Service
   account** → dat ten bat ky (vd `khao-sat-gv`) → Create.
4. Vao service account vua tao → tab **Keys** → **Add Key → Create new
   key** → chon **JSON** → tai file JSON ve may (giu kin, khong dua len
   GitHub).
5. Mo file JSON, lay 2 gia tri: `client_email` va `private_key`.
6. Mo lai Google Sheet o buoc 1.1 → bam **Share** → dan `client_email` vao,
   cap quyen **Editor**.

### 1.3. Dang ky Resend (gui email)

1. Vao https://resend.com → dang ky free bang email cong viec.
2. Vao **API Keys** → tao 1 key moi, luu lai (chi hien 1 lan).
3. (Tuy chon, de gui tu domain rieng thay vi `onboarding@resend.dev`) vao
   **Domains** → xac thuc domain cua don vi.

### 1.4. Bien moi truong

Copy `.env.example` thanh `.env.local`, dien day du:

```
GOOGLE_SHEET_ID=          # lay tu URL Google Sheet: .../d/<SHEET_ID>/edit
GOOGLE_SERVICE_ACCOUNT_EMAIL=   # client_email trong file JSON
GOOGLE_PRIVATE_KEY=       # private_key trong file JSON, giu nguyen \n
RESEND_API_KEY=
RESEND_FROM_EMAIL="Khao sat giang vien <onboarding@resend.dev>"
ADMIN_PASSWORD=           # mat khau dung chung cho trang noi bo QTDT
NEXT_PUBLIC_BASE_URL=     # de trong khi chay local
```

Luu y `GOOGLE_PRIVATE_KEY`: khi dan tu file JSON vao `.env.local`, cac ky
tu xuong dong se la `\n` (2 ky tu backslash-n) — giu nguyen dang do, code
da tu chuyen doi lai.

## 2. Chay thu tren may

```bash
npm install
npm run dev
```

Mo http://localhost:3000 — trang chu co nut vao "Trang noi bo QTDT"
(`/admin`, dang nhap bang `ADMIN_PASSWORD`).

## 3. Cac chuc nang

- **`/admin/gui-khao-sat`**: QTDT chon khoa hoc + giang vien vua day xong +
  ngay day → bam "Gui khao sat" → he thong tao 1 phieu (chua nop) va 1 link
  rieng cho moi hoc vien trong danh sach khoa, gui email qua Resend.
- **`/admin/thong-ke`**: xem theo tung dot da gui — so hoc vien da nop /
  tong so, danh sach chua nop, nut "Gui nhac lai".
- **`/admin/kpi`**: bang KPI theo GV va theo QTDT (loc theo thang), cong
  thuc: `so phieu diem trung binh > 8 / tong so phieu da nop trong ky`,
  dat KPI khi ty le ≥ 96%.
- **`/khao-sat/[ma-phieu]`**: trang khao sat cong khai, hoc vien nhan qua
  email, moi link chi dung duoc 1 lan.

## 4. Deploy len Vercel

1. Tao repo GitHub, push code len (xem huong dan `git` ben duoi).
2. Vao https://vercel.com → dang nhap bang GitHub → **Add New → Project**
   → chon repo vua tao.
3. Trong phan **Environment Variables**, dien day du cac bien nhu file
   `.env.local` (bao gom `NEXT_PUBLIC_BASE_URL` = URL Vercel cap, vi du
   `https://khao-sat-gv.vercel.app`, sua lai sau khi deploy lan dau neu
   can).
4. Deploy.

```bash
git init
git add .
git commit -m "MVP khao sat giang vien - thang 9"
git branch -M main
git remote add origin <URL_REPO_GITHUB_CUA_BAN>
git push -u origin main
```

## 5. Doi chieu truoc khi tin dung so lieu

Theo dung huong dan thang 9: chay song song voi cach tinh thu cong tren
Google Sheet cu it nhat 1 dot, doi chieu so lieu khop truoc khi dung
chinh thuc. Neu lech so, kha nang cao nam o gia dinh "diem >8" tinh tren
**diem trung binh 10 cau** cua 1 phieu (xem `src/lib/kpi.ts`) — can xac
nhan lai voi nguoi phu trach neu chua chac.

## 6. Ban giao khi P.CN xay he thong chinh thuc

Cau truc cot trong Google Sheet (MaHV, MaKhoa, MaGV, Diem...) da co chu y
khop voi mo hinh du lieu trong file dac ta gui P.CN, de import thang du
lieu da tich luy khi he thong chinh thuc ra doi.
