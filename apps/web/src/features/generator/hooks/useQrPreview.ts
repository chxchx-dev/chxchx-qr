/** La API genera el SVG de vista previa; el navegador solo lo presenta. */
import type { QrContent, QrRenderOptions } from "@acore/contracts";
import { useEffect, useState } from "react";
import { renderQrRequest } from "../services/qr-api.client";

const PREVIEW_DEBOUNCE_MS = 650;

export interface QrPreviewState {
  status: "idle" | "loading" | "ready" | "error";
  svg: string | undefined;
}

const INITIAL_STATE: QrPreviewState = { status: "idle", svg: undefined };

export function useQrPreview(input: {
  content: QrContent | undefined;
  options: QrRenderOptions;
}): QrPreviewState {
  const [state, setState] = useState<QrPreviewState>(INITIAL_STATE);

  useEffect(() => {
    const content = input.content;
    if (content === undefined) {
      setState(INITIAL_STATE);
      return;
    }

    setState({ status: "loading", svg: undefined });

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      renderQrRequest(content, { ...input.options, format: "svg" }, controller.signal)
        .then((blob) => blob.text())
        .then((svg) => {
          if (!controller.signal.aborted) setState({ status: "ready", svg });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ status: "error", svg: undefined });
        });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input.content, input.options]);

  return state;
}
