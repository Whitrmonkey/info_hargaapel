import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { hitungUlangReputasi, verifikasiLaporanMenunggu } from "./verifikasi-laporan";

// Lewat Postgres lokal beneran: yang diuji di sini bukan logika murni tapi
// apakah PERTAHANANNYA benar-benar tegak di basis data, bukan cuma di UI.
const admin: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const IPHONE = "a0000000-0000-0000-0000-000000000005"; // iPhone 14, kategori iphone
const MAC = "a0000000-0000-0000-0000-000000000008"; // MacBook Air M4, kategori mac
const SELLER = "b0000000-0000-0000-0000-000000000001";

let userId: string;
const laporanDibuat: number[] = [];
const observasiDibuat: number[] = [];

async function buatLaporan(productId: string, hargaJadi: number, dibuatAt: string, status = "baru") {
  const { data, error } = await admin
    .from("laporan_harga")
    .insert({
      user_id: userId,
      product_id: productId,
      kondisi: "second",
      grade: "standar",
      garansi: "resmi",
      area: "Jakarta Pusat",
      harga_jadi: hargaJadi,
      status,
      dibuat_at: dibuatAt,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  laporanDibuat.push(data.id);
  return data.id;
}

async function buatObservasi(productId: string, harga: number, observedAt: string) {
  const { data, error } = await admin
    .from("price_observations")
    .insert({
      product_id: productId,
      seller_id: SELLER,
      sisi: "jual",
      kondisi: "second",
      grade: "standar",
      garansi: "resmi",
      harga,
      sumber: "scraper",
      observed_at: observedAt,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  observasiDibuat.push(data.id);
  return data.id;
}

beforeEach(async () => {
  const email = `uji-${randomUUID()}@contoh.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw new Error(error.message);
  userId = data.user.id;
  await admin.from("profiles").upsert({ id: userId, peran: "member" });
});

afterEach(async () => {
  await admin.from("penilaian_laporan").delete().in("laporan_id", laporanDibuat.length ? laporanDibuat : [-1]);
  await admin.from("laporan_harga").delete().eq("user_id", userId);
  await admin.from("price_observations").delete().in("id", observasiDibuat.length ? observasiDibuat : [-1]);
  await admin.from("reputasi").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
  laporanDibuat.length = 0;
  observasiDibuat.length = 0;
});

describe("suara meragukan wajib beralasan — ditegakkan basis data", () => {
  it("meragukan tanpa alasan DITOLAK oleh check constraint", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, "2026-03-01T00:00:00Z");
    const { error } = await admin
      .from("penilaian_laporan")
      .insert({ laporan_id: id, user_id: userId, nilai: "meragukan", alasan: null });
    expect(error).not.toBeNull();
  });

  it("meragukan dengan alasan dari daftar tertutup diterima", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, "2026-03-01T00:00:00Z");
    const { error } = await admin
      .from("penilaian_laporan")
      .insert({ laporan_id: id, user_id: userId, nilai: "meragukan", alasan: "bukan_pembeli" });
    expect(error).toBeNull();
  });

  it("alasan di luar daftar tertutup ditolak", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, "2026-03-01T00:00:00Z");
    const { error } = await admin
      .from("penilaian_laporan")
      .insert({ laporan_id: id, user_id: userId, nilai: "meragukan", alasan: "tidak_suka" });
    expect(error).not.toBeNull();
  });

  it("masuk_akal boleh tanpa alasan", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, "2026-03-01T00:00:00Z");
    const { error } = await admin
      .from("penilaian_laporan")
      .insert({ laporan_id: id, user_id: userId, nilai: "masuk_akal", alasan: null });
    expect(error).toBeNull();
  });
});

describe("laporan tidak pernah terverifikasi tanpa observasi independen", () => {
  it("tanpa observasi sesudahnya, laporan tetap menunggu", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - 3 * 86_400_000).toISOString());
    await verifikasiLaporanMenunggu(admin);
    const { data } = await admin.from("laporan_harga").select("status").eq("id", id).single();
    expect(data!.status).toBe("menunggu");
  });

  it("observasi yang tercatat SEBELUM laporan tidak memverifikasinya", async () => {
    await buatObservasi(IPHONE, 8_000_000, new Date(Date.now() - 5 * 86_400_000).toISOString());
    const id = await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - 3 * 86_400_000).toISOString());
    await verifikasiLaporanMenunggu(admin);
    const { data } = await admin.from("laporan_harga").select("status").eq("id", id).single();
    expect(data!.status).toBe("menunggu");
  });

  it("observasi sesudahnya yang cocok membuatnya terverifikasi", async () => {
    const id = await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - 3 * 86_400_000).toISOString());
    const obs = await buatObservasi(IPHONE, 8_100_000, new Date(Date.now() - 86_400_000).toISOString());
    await verifikasiLaporanMenunggu(admin);
    const { data } = await admin.from("laporan_harga").select("status, observasi_id").eq("id", id).single();
    expect(data!.status).toBe("terverifikasi");
    expect(data!.observasi_id).toBe(obs);
  });
});

describe("bobot dihitung per kategori, bukan global", () => {
  it("tiga laporan iphone terverifikasi tidak memberi bobot di mac", async () => {
    for (let i = 0; i < 3; i++) {
      await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - (10 - i) * 86_400_000).toISOString(), "terverifikasi");
    }
    await hitungUlangReputasi(admin, userId);

    const { data: rep } = await admin.from("reputasi").select("kategori, bobot").eq("user_id", userId);
    const iphone = rep!.find((r) => r.kategori === "iphone");
    const mac = rep!.find((r) => r.kategori === "mac");
    expect(iphone!.bobot).toBe(1);
    expect(mac).toBeUndefined();
  });

  it("kategori lain punya barisnya sendiri dengan bobotnya sendiri", async () => {
    for (let i = 0; i < 3; i++) {
      await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - (10 - i) * 86_400_000).toISOString(), "terverifikasi");
    }
    await buatLaporan(MAC, 14_000_000, new Date(Date.now() - 2 * 86_400_000).toISOString(), "terverifikasi");
    await hitungUlangReputasi(admin, userId);

    const { data: rep } = await admin.from("reputasi").select("kategori, bobot, terverifikasi").eq("user_id", userId);
    expect(rep!.find((r) => r.kategori === "iphone")!.bobot).toBe(1);
    expect(rep!.find((r) => r.kategori === "mac")!.bobot).toBe(0);
    expect(rep!.find((r) => r.kategori === "mac")!.terverifikasi).toBe(1);
  });
});

describe("kedaluwarsa bukan kegagalan", () => {
  it("laporan kedaluwarsa tidak menurunkan bobot yang sudah didapat", async () => {
    for (let i = 0; i < 3; i++) {
      await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - (40 - i) * 86_400_000).toISOString(), "terverifikasi");
    }
    await buatLaporan(IPHONE, 8_000_000, new Date(Date.now() - 2 * 86_400_000).toISOString(), "kedaluwarsa");
    await hitungUlangReputasi(admin, userId);

    const { data } = await admin
      .from("reputasi")
      .select("bobot, meleset")
      .eq("user_id", userId)
      .eq("kategori", "iphone")
      .single();
    expect(data!.bobot).toBe(1);
    expect(data!.meleset).toBe(0);
  });
});
