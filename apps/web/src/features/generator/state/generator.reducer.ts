/** Reducer puro del generador (sin efectos ni persistencia). */
import { QR_OPTIONS_DEFAULTS } from "@chxchx/contracts";
import type { GeneratorAction, GeneratorState } from "../generator.types";

export function createInitialState(): GeneratorState {
  return { contentType: "text", drafts: {}, options: { ...QR_OPTIONS_DEFAULTS } };
}

export function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case "SELECT_TYPE":
      return { ...state, contentType: action.contentType };
    case "UPDATE_DRAFT": {
      const current = state.drafts[state.contentType] ?? {};
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [state.contentType]: { ...current, [action.field]: action.value },
        },
      };
    }
    case "RESET_DRAFT": {
      const drafts = { ...state.drafts };
      delete drafts[state.contentType];
      return { ...state, drafts };
    }
    case "UPDATE_OPTIONS":
      return { ...state, options: { ...state.options, ...action.options } };
    case "RESET_OPTIONS":
      return { ...state, options: { ...QR_OPTIONS_DEFAULTS } };
  }
}
