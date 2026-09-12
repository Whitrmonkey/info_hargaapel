import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { situsUrl, situsUrlObjek } from "./situs";

const ASLI = { ...process.env };

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
});
afterEach(() => {
  process.env = { ...ASLI };
});

describe("situsUrl", () => {
  it("memakai NEXT_PUBLIC_SITE_URL kalau isinya alamat sah", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://contoh.test";
    expect(situsUrl()).toBe("https://contoh.test");
  });

  it("STRING KOSONG diperlakukan sebagai tidak ada, bukan sebagai nilai", () => {
    // Ini bug yang menggagalkan build pertama di Vercel: `??` meloloskan
    // string kosong sampai ke new URL("") dan meledak di tengah build.
    process.env.NEXT_PUBLIC_SITE_URL = "";
    expect(situsUrl()).toBe("http://localhost:3000");
  });

  it("spasi doang juga dianggap tidak ada", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    expect(situsUrl()).toBe("http://localhost:3000");
  });

  it("nilai yang bukan alamat http diabaikan", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "hargaapel.com";
    expect(situsUrl()).toBe("http://localhost:3000");
  });

  it("garis miring di ujung dibuang supaya tidak jadi // saat disambung", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://contoh.test/";
    expect(situsUrl()).toBe("https://contoh.test");
  });

  it("jatuh ke alamat produksi Vercel kalau env-nya lupa diisi", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "situs.vercel.app";
    expect(situsUrl()).toBe("https://situs.vercel.app");
  });

  it("alamat produksi menang atas alamat deployment", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "situs.vercel.app";
    process.env.VERCEL_URL = "situs-abc123.vercel.app";
    expect(situsUrl()).toBe("https://situs.vercel.app");
  });

  it("tanpa apa pun, jatuh ke localhost", () => {
    expect(situsUrl()).toBe("http://localhost:3000");
  });
});

describe("situsUrlObjek", () => {
  it("tidak pernah melempar walau env-nya kacau", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    expect(() => situsUrlObjek()).not.toThrow();
    process.env.NEXT_PUBLIC_SITE_URL = ":::bukan url:::";
    expect(() => situsUrlObjek()).not.toThrow();
  });

  it("mengembalikan objek URL yang benar", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://contoh.test";
    expect(situsUrlObjek().host).toBe("contoh.test");
  });
});
