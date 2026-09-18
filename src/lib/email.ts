import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

/**
 * Gui email qua Gmail SMTP (tai khoan Gmail hien co, dung App Password) -
 * khong can mua/xac minh domain rieng nhu Resend. Han che: Gmail thuong gioi
 * han ~500 email/ngay/tai khoan va co the bi chan/vao spam neu gui rat
 * nhieu lien tuc trong thoi gian ngan.
 */
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Thieu bien moi truong GMAIL_USER / GMAIL_APP_PASSWORD. Xem README de tao App Password cho Gmail."
    );
  }
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
}

/** Dia chi gui di luon la GMAIL_USER (Gmail khong cho gia mao dia chi khac), chi ten hien thi doi duoc. */
function diaChiGui(): string {
  const tenHienThi = process.env.GMAIL_FROM_NAME ?? "Khao sat giang vien";
  return `"${tenHienThi}" <${process.env.GMAIL_USER}>`;
}

export async function guiEmailKhaoSat(params: {
  toEmail: string;
  hoTenHocVien: string;
  hoTenGV: string;
  tenKhoa: string;
  link: string;
  laNhacLai?: boolean;
}): Promise<void> {
  const tieuDe = params.laNhacLai
    ? `[Nhac nho] Khao sat chat luong giang vien - ${params.hoTenGV} - ${params.tenKhoa}`
    : `Khao sat chat luong giang vien - ${params.hoTenGV} - ${params.tenKhoa}`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#F0F8FE; padding: 24px;">
    <div style="background:#0056A9; color:#fff; padding:16px 20px; border-radius:8px 8px 0 0;">
      <h2 style="margin:0; font-size:18px;">Khao sat chat luong giang vien</h2>
    </div>
    <div style="background:#fff; padding:20px; border-radius:0 0 8px 8px;">
      <p>Chao ${params.hoTenHocVien || "ban"},</p>
      <p>${params.laNhacLai ? "Ban chua hoan thanh khao sat cho buoi hoc gan day. " : ""}
      Vui long danh 2 phut danh gia chat luong giang day cua giang vien <b>${params.hoTenGV}</b>
      trong khoa <b>${params.tenKhoa}</b>. Y kien cua ban giup chung toi nang cao chat luong dao tao.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${params.link}" style="background:#CF1A21; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
          Lam khao sat ngay
        </a>
      </p>
      <p style="font-size:12px; color:#666;">Neu nut khong hoat dong, sao chep duong dan sau vao trinh duyet:<br/>${params.link}</p>
    </div>
  </div>`;

  await getTransporter().sendMail({
    from: diaChiGui(),
    to: params.toEmail,
    subject: tieuDe,
    html,
  });
}

/** Khoa co nhieu giang vien (vd nhieu buoi, moi buoi 1 GV) - 1 email/1 link danh gia het cac GV trong 1 lan. */
export async function guiEmailKhaoSatNhieuGV(params: {
  toEmail: string;
  hoTenHocVien: string;
  tenKhoa: string;
  tenGVs: string[];
  link: string;
  laNhacLai?: boolean;
}): Promise<void> {
  const tieuDe = params.laNhacLai
    ? `[Nhac nho] Khao sat chat luong giang vien - ${params.tenKhoa}`
    : `Khao sat chat luong giang vien - ${params.tenKhoa}`;

  const dsGVHtml = params.tenGVs.map((t) => `<li>${t}</li>`).join("");

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#F0F8FE; padding: 24px;">
    <div style="background:#0056A9; color:#fff; padding:16px 20px; border-radius:8px 8px 0 0;">
      <h2 style="margin:0; font-size:18px;">Khao sat chat luong giang vien</h2>
    </div>
    <div style="background:#fff; padding:20px; border-radius:0 0 8px 8px;">
      <p>Chao ${params.hoTenHocVien || "ban"},</p>
      <p>${params.laNhacLai ? "Ban chua hoan thanh khao sat cho khoa hoc gan day. " : ""}
      Khoa hoc <b>${params.tenKhoa}</b> co nhieu giang vien dung lop, vui long danh vai phut
      danh gia lan luot tung giang vien sau (chi can 1 lan bam, 1 link duy nhat):</p>
      <ul>${dsGVHtml}</ul>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${params.link}" style="background:#CF1A21; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
          Lam khao sat ngay
        </a>
      </p>
      <p style="font-size:12px; color:#666;">Neu nut khong hoat dong, sao chep duong dan sau vao trinh duyet:<br/>${params.link}</p>
    </div>
  </div>`;

  await getTransporter().sendMail({
    from: diaChiGui(),
    to: params.toEmail,
    subject: tieuDe,
    html,
  });
}

/**
 * Gui 1 danh sach viec (thuong la cac lenh gui email) TUAN TU, khong song
 * song - Gmail SMTP tu choi bot ket noi neu mo qua nhieu ket noi cung luc
 * tu cung 1 tai khoan (khac voi Resend/SES la API HTTP chiu duoc goi song
 * song). Tra ve dang giong Promise.allSettled de cac route giu nguyen cach
 * dem soLoi/soThanhCong.
 */
export async function chayTuanTu<T>(
  danhSach: T[],
  viec: (item: T) => Promise<void>,
  ngungGiuaMoiLan = 300
): Promise<PromiseSettledResult<void>[]> {
  const ketQua: PromiseSettledResult<void>[] = [];
  for (const item of danhSach) {
    try {
      await viec(item);
      ketQua.push({ status: "fulfilled", value: undefined });
    } catch (err) {
      ketQua.push({ status: "rejected", reason: err });
    }
    if (ngungGiuaMoiLan > 0) {
      await new Promise((r) => setTimeout(r, ngungGiuaMoiLan));
    }
  }
  return ketQua;
}
