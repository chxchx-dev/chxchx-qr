import { QR_OPTIONS_DEFAULTS } from "@acore/contracts";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  generatorReducer,
} from "../src/features/generator/state/generator.reducer";

describe("generatorReducer", () => {
  it("SELECT_TYPE cambia el tipo activo sin tocar drafts ni options", () => {
    const state = createInitialState();
    const next = generatorReducer(state, { type: "SELECT_TYPE", contentType: "wifi" });
    expect(next.contentType).toBe("wifi");
    expect(next.drafts).toEqual({});
    expect(next.options).toEqual(QR_OPTIONS_DEFAULTS);
  });

  it("UPDATE_DRAFT guarda el campo en el draft del tipo activo (memoria únicamente)", () => {
    let state = createInitialState();
    state = generatorReducer(state, { type: "SELECT_TYPE", contentType: "wifi" });
    state = generatorReducer(state, { type: "UPDATE_DRAFT", field: "ssid", value: "MiRed" });
    expect(state.drafts.wifi).toEqual({ ssid: "MiRed" });
    // Otros tipos no se ven afectados
    expect(state.drafts.text).toBeUndefined();
  });

  it("UPDATE_DRAFT conserva los campos previos del mismo tipo", () => {
    let state = createInitialState();
    state = generatorReducer(state, { type: "UPDATE_DRAFT", field: "text", value: "hola" });
    state = generatorReducer(state, { type: "UPDATE_DRAFT", field: "extra", value: "mundo" });
    expect(state.drafts.text).toEqual({ text: "hola", extra: "mundo" });
  });

  it("RESET_DRAFT borra solo el draft del tipo activo", () => {
    let state = createInitialState();
    state = generatorReducer(state, { type: "UPDATE_DRAFT", field: "text", value: "hola" });
    state = generatorReducer(state, { type: "SELECT_TYPE", contentType: "url" });
    state = generatorReducer(state, { type: "UPDATE_DRAFT", field: "url", value: "https://x.dev" });
    state = generatorReducer(state, { type: "RESET_DRAFT" });
    expect(state.drafts.url).toBeUndefined();
    expect(state.drafts.text).toEqual({ text: "hola" });
  });

  it("UPDATE_OPTIONS mezcla opciones parciales", () => {
    const state = createInitialState();
    const next = generatorReducer(state, {
      type: "UPDATE_OPTIONS",
      options: { size: 512, format: "gif" },
    });
    expect(next.options.size).toBe(512);
    expect(next.options.format).toBe("gif");
    expect(next.options.ecc).toBe(QR_OPTIONS_DEFAULTS.ecc);
    expect(next.options.foreground).toBe(QR_OPTIONS_DEFAULTS.foreground);
  });

  it("RESET_OPTIONS devuelve los defaults del contrato", () => {
    let state = createInitialState();
    state = generatorReducer(state, {
      type: "UPDATE_OPTIONS",
      options: { size: 4096, marginModules: 0 },
    });
    const next = generatorReducer(state, { type: "RESET_OPTIONS" });
    expect(next.options).toEqual(QR_OPTIONS_DEFAULTS);
    expect(next.options.size).not.toBe(4096);
  });
});
