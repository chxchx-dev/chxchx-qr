/** Guía de impresión: tamaño físico de referencia y consejos (Fase 04). */
import { ui } from "../../../shared/lib/messages";

/** 300 DPI: píxeles → cm (1 in = 2.54 cm). */
function physicalSizeCm(pixels: number, dpi = 300): number {
  return (pixels / dpi) * 2.54;
}

export function PrintSizeGuide({ size }: { size: number }) {
  const cm = physicalSizeCm(size);
  return (
    <section aria-labelledby="print-title" className="flex flex-col gap-2">
      <h2 id="print-title" className="text-sm font-semibold text-text">
        {ui.print.title}
      </h2>
      <p className="text-xs text-muted">
        {ui.print.physicalSize.replace("{size}", String(size)).replace("{cm}", cm.toFixed(1))}
      </p>
      <p className="text-xs text-muted">{ui.print.physicalHint}</p>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
        <li>{ui.print.margin}</li>
        <li>{ui.print.contrast}</li>
        <li>{ui.print.test}</li>
      </ul>
    </section>
  );
}
