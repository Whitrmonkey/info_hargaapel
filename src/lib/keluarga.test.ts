import { describe, expect, it } from "vitest";
import { fase, KELUARGA } from "./keluarga";

describe("fase hidup", () => {
  it("memakai laju, bukan umur -- dua model seumuran bisa beda fase", () => {
    expect(fase(-0.019).kode).toBe("cepat");
    expect(fase(-0.006).kode).toBe("landai");
  });

  it("batas pita persis seperti yang ditulis di spec", () => {
    expect(fase(-0.018).kode).toBe("cepat");
    expect(fase(-0.0179).kode).toBe("sedang");
    expect(fase(-0.01).kode).toBe("sedang");
    expect(fase(-0.0099).kode).toBe("landai");
    expect(fase(-0.005).kode).toBe("landai");
    expect(fase(-0.0049).kode).toBe("datar");
  });

  it("harga yang naik tetap masuk praktis datar, bukan pita turun", () => {
    expect(fase(0.01).kode).toBe("datar");
  });
});

describe("KELUARGA", () => {
  it("hanya empat rute yang sah", () => {
    expect(Object.keys(KELUARGA).sort()).toEqual(["ipad", "iphone", "mac", "watch"]);
  });
});
