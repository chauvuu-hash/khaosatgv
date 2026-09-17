# Khao sat chat luong giang vien (ban MVP thang 9/2026)

Cong cu tam thoi cho P.NVDT, thay 4 viec dang lam thu cong: sua form khao
sat, gui khao sat qua email ngay sau buoi hoc, thong ke ty le nop phieu,
tinh KPI GV/QTDT tu dong. **Khong** phai he thong chinh thuc (viec do P.CN
lam, theo file dac ta). Pham vi da thu gon: **khong** co lich phan cong
buoi hoc tu dong — QTDT tu bam nut "Gui khao sat" ngay sau khi 1 GV day
xong 1 buoi.

## 1. Chuan bi (lam truoc khi chay duoc)

### 1.1. Tao Google Sheet lam "database"

Tao 1 Google Sheet moi, gom 5 tab (dong 1 la ten cot, dung chinh xac nhu
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

**Tab `DonVi`** — danh sach Don vi / Mien de xo thu muc chon trong form khao
sat dung chung (thay vi hoc vien tu go). Cot B = danh sach Don vi, cot C =
danh sach Mien, **2 danh sach doc lap** (khong can khop hang voi nhau, do
dai khac nhau tuy y):
| (bo trong) | DonVi | Mien |
|---|---|---|
| | Dai BRCD | Mien Bac |
| | Dai Di dong | Mien Trung |
| | Dai CNTT&DVS | Mien Nam |
| | ... (chi con DonVi, cot Mien de trong) | |

**Tab `PhieuKhaoSat`** — de trong, he thong tu ghi. Chi can co dong header:
```
MaPhieu	MaHV	MaKhoa	MaGV	NgayDay	NgayGui	NgayHoanThanh	Diem1	Diem2	Diem3	Diem4	Diem5	Diem6	Diem7	Diem8	Diem9	Diem10	DiemTB	TrangThai	HoTenNhap	DonViNhap	MienNhap	YKienKhac
```
4 cot cuoi (`HoTenNhap`, `DonViNhap`, `MienNhap`, `YKienKhac`) — 3 cot dau
chi co gia tri khi nop qua "link dung chung" (khong co MaHV vi chua co danh
sach hoc vien); `YKienKhac` la cau 11 (y kien dong gop tu do, khong bat
buoc), ap dung cho ca 2 luong nop phieu.

### 1.2. Cap quyen doc/ghi Google Sheet cho ung dung

Co 2 cach — dung **Cach A** truoc, chi doi sang Cach B neu to chuc cua ban
KHONG chan tao Service Account key (nhieu to chuc — vd VNPT — chan san boi
chinh sach bao mat `iam.disableServiceAccountKeyCreation`, se bao loi
"An Organization Policy that blocks service accounts key creation...").

#### Cach A — OAuth voi chinh tai khoan Google cua ban (khuyen nghi, khong bi chinh sach to chuc chan)

1. Vao https://console.cloud.google.com/ → tao 1 project moi (hoac dung
   project co san) bang **tai khoan Google dang co quyen chinh sua Sheet
   o buoc 1.1** (khong can Share them cho ai ca).
2. Vao **APIs & Services → Library**, tim "Google Sheets API" → bam
   **Enable**.
3. Vao **APIs & Services → OAuth consent screen** → chon **External**
   (hoac Internal neu co Workspace) → dien ten app bat ky (vd
   `Khao sat GV`) + email cua ban → Save. Khong can submit xet duyet, o
   che do "Testing" van dung duoc.
   - O muc **Test users**, bam **Add users** → them chinh email Google
     ban se dung de dang nhap o buoc sau.
4. Vao **APIs & Services → Credentials** → **Create Credentials → OAuth
   client ID** → Application type: **Desktop app** → dat ten bat ky →
   Create. Ghi lai **Client ID** va **Client secret** hien ra (day khong
   phai Service Account key nen khong bi chinh sach to chuc chan).
5. Vao https://developers.google.com/oauthplayground/
   - Bam icon banh rang ⚙️ (goc tren phai) → tick **Use your own OAuth
     credentials** → dan **Client ID** va **Client secret** vua tao.
   - O khung ben trai, tim va tick **Google Sheets API v4** →
     `https://www.googleapis.com/auth/spreadsheets` → bam **Authorize
     APIs** → dang nhap bang tai khoan Google co quyen chinh sua Sheet →
     Allow.
   - Bam **Exchange authorization code for tokens** → copy gia tri
     **Refresh token** hien ra (dang `1//...`).

Ket qua Cach A can 3 gia tri: `GOOGLE_OAUTH_CLIENT_ID`,
`GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`.

#### Cach B — Service Account (chi dung neu to chuc cho phep tao key JSON)

1. Vao https://console.cloud.google.com/ → tao/chon project → Enable
   "Google Sheets API" (nhu tren).
2. Vao **APIs & Services → Credentials** → **Create Credentials → Service
   account** → dat ten bat ky → Create.
3. Vao service account vua tao → tab **Keys** → **Add Key → Create new
   key** → chon **JSON** → tai file JSON ve may (giu kin, khong dua len
   GitHub).
4. Mo file JSON, lay 2 gia tri: `client_email` va `private_key`.
5. Mo lai Google Sheet o buoc 1.1 → bam **Share** → dan `client_email`
   vao, cap quyen **Editor**.

Ket qua Cach B can 2 gia tri: `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_PRIVATE_KEY`.

### 1.3. Dang ky Resend (gui email)

1. Vao https://resend.com → dang ky free bang email cong viec.
2. Vao **API Keys** → tao 1 key moi, luu lai (chi hien 1 lan).
3. (Tuy chon, de gui tu domain rieng thay vi `onboarding@resend.dev`) vao
   **Domains** → xac thuc domain cua don vi.

### 1.4. Bien moi truong

Copy `.env.example` thanh `.env.local`, dien day du:

```
GOOGLE_SHEET_ID=          # lay tu URL Google Sheet: .../d/<SHEET_ID>/edit

# Dien 3 dong nay NEU dung Cach A (OAuth):
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=

# Hoac dien 2 dong nay NEU dung Cach B (Service Account):
GOOGLE_SERVICE_ACCOUNT_EMAIL=   # client_email trong file JSON
GOOGLE_PRIVATE_KEY=       # private_key trong file JSON, giu nguyen \n

RESEND_API_KEY=
RESEND_FROM_EMAIL="Khao sat giang vien <onboarding@resend.dev>"
ADMIN_PASSWORD=           # mat khau dung chung cho trang noi bo QTDT
NEXT_PUBLIC_BASE_URL=     # de trong khi chay local
```

Code se tu uu tien Cach A neu co `GOOGLE_OAUTH_REFRESH_TOKEN`, khong thi
dung Cach B. Luu y `GOOGLE_PRIVATE_KEY` (Cach B): khi dan tu file JSON vao
`.env.local`, cac ky tu xuong dong se la `\n` (2 ky tu backslash-n) — giu
nguyen dang do, code da tu chuyen doi lai.

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
chinh thuc.

Da chot (16/9/2026, sau khi doi chieu voi cach tinh tay phat hien lech so):
"diem dat" = **diem trung binh 10 cau >= 8** (khong phai > 8 nhu gia dinh
ban dau trong dac ta) — xem `src/lib/kpi.ts` (`NGUONG_DIEM_DAT`).

## 6. Ban giao khi P.CN xay he thong chinh thuc

Cau truc cot trong Google Sheet (MaHV, MaKhoa, MaGV, Diem...) da co chu y
khop voi mo hinh du lieu trong file dac ta gui P.CN, de import thang du
lieu da tich luy khi he thong chinh thuc ra doi.
