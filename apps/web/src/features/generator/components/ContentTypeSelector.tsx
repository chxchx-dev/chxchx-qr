/** Selector de tipo: radiogroup con navegación por teclado (flechas, Home, End). */
import { type KeyboardEvent, useRef } from "react";
import { ui } from "../../../shared/lib/messages";
import { CONTENT_TYPES, type QrContentType } from "../generator.types";

export function ContentTypeSelector({
  value,
  onChange,
}: {
  value: QrContentType;
  onChange: (type: QrContentType) => void;
}) {
  const buttonsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const types = CONTENT_TYPES;

  function moveFocus(index: number): void {
    const type = types[index];
    if (type === undefined) {
      return;
    }
    onChange(type);
    buttonsRef.current[type]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    const current = types.indexOf(value);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus((current + 1) % types.length);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus((current - 1 + types.length) % types.length);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(types.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <section aria-labelledby="type-selector-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="type-selector-title" className="text-sm font-semibold text-text">
          {ui.selector.label}
        </h2>
        <span className="hidden text-xs text-muted sm:block">{ui.selector.instructions}</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="type-selector-title"
        className="mt-3 grid grid-cols-3 gap-2"
      >
        {types.map((type) => {
          const meta = ui.types[type];
          const checked = type === value;
          return (
            <button
              key={type}
              ref={(element) => {
                buttonsRef.current[type] = element;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={`flex min-h-16 flex-col justify-center gap-0.5 rounded-md border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                checked
                  ? "border-primary bg-primary/10"
                  : "border-surface bg-surface hover:border-muted"
              }`}
              onClick={() => {
                onChange(type);
                buttonsRef.current[type]?.focus();
              }}
              onKeyDown={handleKeyDown}
            >
              <span className="text-sm font-medium text-text">{meta.label}</span>
              <span className="truncate text-xs text-muted">{meta.example}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
