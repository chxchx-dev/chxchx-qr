/** Validación: local (esquema compartido) + API (debounce corto, abort de requests viejos). */
import {
  ErrorCodes,
  type QrContent,
  type QrDensity,
  type QrRenderOptions,
} from "@chxchx/contracts";
import { useEffect, useRef, useState } from "react";
import { ui } from "../../../shared/lib/messages";
import type { ContentDraft, QrContentType } from "../generator.types";
import { validateDraft } from "../lib/validate-draft";
import { QrApiError, validateQrRequest } from "../services/qr-api.client";

export type QrValidationStatus =
  | "idle"
  | "validating"
  | "valid"
  | "warning"
  | "invalid"
  | "server-error";

export interface QrValidationState {
  status: QrValidationStatus;
  fieldErrors: Record<string, string>;
  /** DTO validado por el contrato (listo para descargar una vez exportable). */
  dto: QrContent | undefined;
  payload: string | undefined;
  density: QrDensity | undefined;
  warnings: string[];
  recommendations: string[];
  message: string | undefined;
}

const API_DEBOUNCE_MS = 300;

const initialState: QrValidationState = {
  status: "idle",
  fieldErrors: {},
  dto: undefined,
  payload: undefined,
  density: undefined,
  warnings: [],
  recommendations: [],
  message: undefined,
};

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useQrValidation(input: {
  type: QrContentType;
  draft: ContentDraft;
  options: QrRenderOptions;
}): QrValidationState {
  const [state, setState] = useState<QrValidationState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const { dto, errors, hasInput } = validateDraft(input.type, input.draft);
    if (!hasInput) {
      setState({ ...initialState, status: "idle" });
      return;
    }
    if (dto === undefined) {
      setState({ ...initialState, status: "invalid", fieldErrors: errors });
      return;
    }

    setState((prev) => ({ ...prev, status: "validating", dto }));
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => {
      validateQrRequest(dto, input.options, controller.signal)
        .then((result) => {
          setState({
            status: result.density === "safe" && result.warnings.length === 0 ? "valid" : "warning",
            fieldErrors: {},
            dto,
            payload: result.canonicalPayload,
            density: result.density,
            warnings: result.warnings,
            recommendations: result.recommendations,
            message: undefined,
          });
        })
        .catch((error: unknown) => {
          if (isAbort(error)) {
            return;
          }
          if (error instanceof QrApiError && error.code === ErrorCodes.QR_PAYLOAD_TOO_LARGE) {
            setState({ ...initialState, status: "invalid", message: ui.validation.overflow });
            return;
          }
          if (error instanceof QrApiError && error.status === 422) {
            // Contraste/colores: bloquea la exportación con el detalle del servidor.
            setState({
              ...initialState,
              status: "invalid",
              message: error.detail ?? ui.validation.invalid,
            });
            return;
          }
          setState({
            ...initialState,
            status: "server-error",
            message: ui.validation.serverError,
          });
        });
    }, API_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input.type, input.draft, input.options]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return state;
}
