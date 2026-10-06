import { describe, expect, it } from "vitest";
import { destinoSeguro, esRutaDeAcceso, esRutaProtegida, mensajeDeError, validarEmail, validarPassword } from "./rutas";

describe("destinoSeguro (anti open-redirect)", () => {
  it("acepta rutas internas", () => {
    expect(destinoSeguro("/aprender")).toBe("/aprender");
    expect(destinoSeguro("/dashboard?x=1")).toBe("/dashboard?x=1");
  });
  it.each(["https://malo.com", "//malo.com", "/\\malo.com", "javascript:alert(1)", "", null, undefined, "/a\nb"])(
    "rechaza %j",
    (v) => expect(destinoSeguro(v as string | null | undefined)).toBe("/dashboard"),
  );
});

describe("rutas", () => {
  it("protege panel y onboarding, no el login", () => {
    expect(esRutaProtegida("/dashboard")).toBe(true);
    expect(esRutaProtegida("/onboarding")).toBe(true);
    expect(esRutaProtegida("/aprender/x")).toBe(true);
    expect(esRutaProtegida("/login")).toBe(false);
    expect(esRutaProtegida("/dashboardfalso")).toBe(false);
    expect(esRutaProtegida("/api/chat")).toBe(false);
  });
  it("detecta rutas de acceso", () => {
    expect(esRutaDeAcceso("/login")).toBe(true);
    expect(esRutaDeAcceso("/registro")).toBe(true);
    expect(esRutaDeAcceso("/dashboard")).toBe(false);
  });
});

describe("validaciones y mensajes", () => {
  it("email", () => {
    expect(validarEmail("a@b.co")).toBe(true);
    expect(validarEmail("a@b")).toBe(false);
    expect(validarEmail("a b@c.com")).toBe(false);
  });
  it("contraseña: 8+, letra y número", () => {
    expect(validarPassword("abc12345")).toBe(true);
    expect(validarPassword("abcdefgh")).toBe(false);
    expect(validarPassword("12345678")).toBe(false);
    expect(validarPassword("ab12")).toBe(false);
  });
  it("errores en español y genéricos", () => {
    expect(mensajeDeError("invalid_credentials")).toMatch(/no coinciden/);
    expect(mensajeDeError("algo_raro")).toMatch(/No pudimos/);
  });
});
