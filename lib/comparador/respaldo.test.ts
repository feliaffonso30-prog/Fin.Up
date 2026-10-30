import { describe, expect, it, vi } from "vitest";
import { AVISO_DESACTUALIZADO, AVISO_SIN_DATOS, conRespaldo, type Copia } from "./respaldo";

const AHORA = Date.parse("2026-10-09T12:00:00Z");
const HORA = 3_600_000;
const copia = (horasAtras: number, datos = ["x"]): Copia<string[]> => ({
  datos,
  actualizadoEn: new Date(AHORA - horasAtras * HORA).toISOString(),
});

const base = (obtener: () => Promise<Copia<string[]>>, ultimaBuena = new Map<string, Copia<unknown>>()) =>
  conRespaldo<string[]>({ clave: "pf", obtener, vacio: [], edadMaximaMs: 2 * HORA, ultimaBuena, ahora: AHORA, registrarError: () => {} });

describe("conRespaldo", () => {
  it("dato fresco → ok, y lo guarda como última copia buena", async () => {
    const memoria = new Map<string, Copia<unknown>>();
    const r = await base(async () => copia(0.5), memoria);
    expect(r.estado).toBe("ok");
    expect(r.aviso).toBeUndefined();
    expect(memoria.get("pf")).toEqual(copia(0.5));
  });

  it("la caché sirve un dato viejo (la API no se pudo renovar) → desactualizado con aviso", async () => {
    const r = await base(async () => copia(5));
    expect(r.estado).toBe("desactualizado");
    expect(r.datos).toEqual(["x"]);
    expect(r.aviso).toBe(AVISO_DESACTUALIZADO);
  });

  it("API caída con copia previa → muestra la copia y avisa", async () => {
    const memoria = new Map<string, Copia<unknown>>([["pf", copia(1, ["previo"])]]);
    const r = await base(async () => {
      throw new Error("503");
    }, memoria);
    expect(r).toMatchObject({ estado: "desactualizado", datos: ["previo"], aviso: AVISO_DESACTUALIZADO });
    expect(r.actualizadoEn).toBe(copia(1).actualizadoEn);
  });

  it("API caída sin nada previo → error con datos vacíos, sin tirar excepción", async () => {
    const r = await base(async () => {
      throw new Error("timeout");
    });
    expect(r).toEqual({ datos: [], estado: "error", actualizadoEn: null, aviso: AVISO_SIN_DATOS });
  });

  it("registra el error para los logs", async () => {
    const registrarError = vi.fn();
    await conRespaldo({
      clave: "fci",
      obtener: async () => {
        throw new Error("caída");
      },
      vacio: null,
      edadMaximaMs: HORA,
      ultimaBuena: new Map(),
      registrarError,
    });
    expect(registrarError).toHaveBeenCalledWith("fci", expect.any(Error));
  });
});
