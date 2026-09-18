import { Resend } from "resend";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Thieu bien moi truong RESEND_API_KEY. Xem README de dang ky Resend.");
  }
  return new Resend(key);
}

export async function guiEmailKhaoSat(params: {
  toEmail: string;
  hoTenHocVien: string;
  hoTenGV: string;
  tenKhoa: string;
  link: string;
  laNhacLai?: boolean;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "Khao sat GV <onboarding@resend.dev>";
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

  const { error } = await getResend().emails.send({
    from,
    to: params.toEmail,
    subject: tieuDe,
    html,
  });
  if (error) {
    throw new Error(`Resend tu choi gui toi ${params.toEmail}: ${error.message}`);
  }
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
  const from = process.env.RESEND_FROM_EMAIL ?? "Khao sat GV <onboarding@resend.dev>";
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

  const { error } = await getResend().emails.send({
    from,
    to: params.toEmail,
    subject: tieuDe,
    html,
  });
  if (error) {
    throw new Error(`Resend tu choi gui toi ${params.toEmail}: ${error.message}`);
  }
}
