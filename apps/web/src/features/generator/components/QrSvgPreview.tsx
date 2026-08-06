/**
 * Renderiza el SVG de vista previa. Es seguro usar dangerouslySetInnerHTML:
 * el SVG lo genera `qr-core` internamente (rect + path, sin scripts/enlaces)
 * a partir de colores validados por el contrato.
 */
import { ui } from "../../../shared/lib/messages";

export function QrSvgPreview({ svg, zoom }: { svg: string | undefined; zoom: number }) {
  if (svg === undefined) {
    return (
      <div
        className="flex aspect-square w-full max-w-64 items-center justify-center rounded-md border border-dashed border-surface bg-surface/40 p-4 text-center text-sm text-muted"
        aria-label={ui.preview.placeholder}
        role="img"
      >
        {ui.preview.placeholder}
      </div>
    );
  }
  return (
    <div
      className="overflow-auto rounded-md border border-surface bg-white p-3"
      style={{ width: "min(100%, 20rem)" }}
    >
      {/* El QR exportado no lleva sombras ni fondo de la UI (08 §9): fondo blanco neutro. */}
      <div
        className="mx-auto origin-center"
        style={{ transform: `scale(${zoom})`, width: "16rem", height: "16rem" }}
        aria-hidden="true"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generado por qr-core (rect+path, sin scripts/enlaces); ver cabecera.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
