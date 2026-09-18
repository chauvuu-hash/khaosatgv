export type CapGVNgay = { maGV: string; ngayDay: string };

/**
 * Ma hoa danh sach {maGV, ngayDay} thanh 1 chuoi de nhet vao 1 segment URL -
 * dung cho link khao sat dung chung khi khoa co nhieu giang vien (khong co
 * danh sach hoc vien/email). File nay khong dong goi googleapis nen dung
 * duoc ca o client component lan server.
 */
export function encodeDsGV(danhSachGV: CapGVNgay[]): string {
  return danhSachGV.map((g) => `${g.maGV}~${g.ngayDay}`).join(",");
}

export function parseDsGV(dsGV: string): CapGVNgay[] {
  return dsGV
    .split(",")
    .map((cap) => {
      const [maGV, ngayDay] = cap.split("~");
      return { maGV: maGV ?? "", ngayDay: ngayDay ?? "" };
    })
    .filter((g) => g.maGV && g.ngayDay);
}
