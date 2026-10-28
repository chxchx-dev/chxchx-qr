/** Descarga por la API: blob → ObjectURL → <a download> → revoke + anuncio. */
import type { QrContent, QrRenderOptions } from "@chxchx/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { ui } from "../../../shared/lib/messages";
import { sanitizeFilename } from "../../../shared/lib/sanitize-filename";
import { renderQrRequest } from "../services/qr-api.client";

export type QrDownloadStatus = "idle" | "downloading" | "done" | "error";

export interface QrDownloadState {
  status: QrDownloadStatus;
  message: string | undefined;
}

export function useQrDownload() {
  const [state, setState] = useState<QrDownloadState>({ status: "idle", message: undefined });
  const abortRef = useRef<AbortController | null>(null);

  const download = useCallback(
    async (input: { content: QrContent; options: QrRenderOptions; filename: string }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: "downloading", message: undefined });
      try {
        const blob = await renderQrRequest(input.content, input.options, controller.signal);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${sanitizeFilename(input.filename)}.${input.options.format}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setState({ status: "done", message: ui.download.done });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({ status: "error", message: ui.download.error });
      }
    },
    [],
  );

  const copy = useCallback(async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      setState({ status: "done", message: ui.download.copied });
    } catch {
      setState({ status: "error", message: ui.download.error });
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, download, copy };
}
