/** Rutas del MVP: una sola pantalla pública, el generador. */
import { GeneratorScreen } from "../features/generator/components/GeneratorScreen";
import { ui } from "../shared/lib/messages";

export function Routes() {
  return (
    <>
      <GeneratorScreen />
      <section aria-labelledby="how-it-works-title" className="mt-14">
        <h2 id="how-it-works-title" className="text-lg font-semibold text-text">
          {ui.howItWorks.title}
        </h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted">
          {ui.howItWorks.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </>
  );
}
