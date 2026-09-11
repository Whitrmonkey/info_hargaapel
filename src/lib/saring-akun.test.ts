import { describe, expect, it } from "vitest";
import { domainDari, periksaMx, saringEmail } from "./saring-akun";

const tidakDiblokir = async () => false;
const selaluDiblokir = async () => true;
const mxAda = async () => [{ exchange: "mx.contoh.com", priority: 10 }];
const mxKosong = async () => [];

function mxGagal(kode?: string) {
  return async () => {
    const e = new Error("gagal") as Error & { code?: string };
    if (kode) e.code = kode;
    throw e;
  };
}

describe("domainDari", () => {
  it("mengambil domain dan menormalkan huruf besar", () => {
    expect(domainDari("Orang@Contoh.COM")).toBe("contoh.com");
  });

  it("alamat tanpa @ atau tanpa domain -> null", () => {
    expect(domainDari("bukanemail")).toBeNull();
    expect(domainDari("orang@")).toBeNull();
    expect(domainDari("a@b@c")).toBeNull();
  });
});

describe("periksaMx", () => {
  it("ada MX -> ada", async () => {
    expect(await periksaMx("contoh.com", mxAda)).toBe("ada");
  });

  it("daftar MX kosong -> tidak ada", async () => {
    expect(await periksaMx("contoh.com", mxKosong)).toBe("tidak_ada");
  });

  it("NXDOMAIN dan NODATA adalah jawaban pasti, bukan kegagalan", async () => {
    expect(await periksaMx("contoh.com", mxGagal("ENOTFOUND"))).toBe("tidak_ada");
    expect(await periksaMx("contoh.com", mxGagal("ENODATA"))).toBe("tidak_ada");
  });

  it("galat jaringan lain -> gagal, supaya bisa diloloskan", async () => {
    expect(await periksaMx("contoh.com", mxGagal("ETIMEOUT"))).toBe("gagal");
    expect(await periksaMx("contoh.com", mxGagal())).toBe("gagal");
  });
});

describe("saringEmail", () => {
  it("domain sekali pakai ditolak sebelum DNS ditanya", async () => {
    let ditanya = false;
    const lookup = async () => {
      ditanya = true;
      return [{ exchange: "mx", priority: 1 }];
    };
    const h = await saringEmail("a@buangan.com", selaluDiblokir, lookup);
    expect(h).toEqual({ boleh: false, alasan: "domain_sekali_pakai" });
    expect(ditanya).toBe(false);
  });

  it("domain tanpa server surat ditolak", async () => {
    const h = await saringEmail("a@salahketik.com", tidakDiblokir, mxKosong);
    expect(h.alasan).toBe("tanpa_server_surat");
  });

  it("DNS kita yang bermasalah TIDAK menghukum penggunanya", async () => {
    const h = await saringEmail("a@contoh.com", tidakDiblokir, mxGagal("ESERVFAIL"));
    expect(h.boleh).toBe(true);
  });

  it("alamat wajar diloloskan", async () => {
    expect(await saringEmail("orang@contoh.com", tidakDiblokir, mxAda)).toEqual({ boleh: true });
  });

  it("format salah ditolak tanpa menanyakan apa pun", async () => {
    const h = await saringEmail("bukanemail", selaluDiblokir, mxAda);
    expect(h.alasan).toBe("format");
  });
});
