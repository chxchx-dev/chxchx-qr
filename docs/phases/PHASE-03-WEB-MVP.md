# Fase 03 — Generador Web MVP

## Objetivo

Entregar una experiencia mobile-first para generar QR estáticos sin cuenta.

## Resultado

El usuario elige tipo, ingresa datos, ve preview, valida y descarga SVG/GIF.

## Fuera de alcance

- logo;
- PNG;
- upload;
- cuenta;
- QR dinámico;
- analítica.

## Archivos

```text
apps/web/src/
├─ app/
│  ├─ App.tsx
│  ├─ providers.tsx
│  └─ routes.tsx
├─ features/generator/
│  ├─ components/
│  │  ├─ ContentTypeSelector.tsx
│  │  ├─ GeneratorForm.tsx
│  │  ├─ PreviewPanel.tsx
│  │  ├─ QrSvgPreview.tsx
│  │  ├─ QrOptionsPanel.tsx
│  │  ├─ ValidationSummary.tsx
│  │  └─ DownloadActions.tsx
│  ├─ forms/
│  │  ├─ TextFields.tsx
│  │  ├─ UrlFields.tsx
│  │  ├─ EmailFields.tsx
│  │  ├─ PhoneFields.tsx
│  │  ├─ SmsFields.tsx
│  │  ├─ WifiFields.tsx
│  │  ├─ VCardFields.tsx
│  │  ├─ CalendarFields.tsx
│  │  └─ GeoFields.tsx
│  ├─ hooks/
│  │  ├─ useQrPreview.ts
│  │  ├─ useQrValidation.ts
│  │  └─ useQrDownload.ts
│  ├─ services/
│  │  └─ qr-api.client.ts
│  ├─ state/
│  │  └─ generator.reducer.ts
│  └─ generator.types.ts
├─ shared/
│  ├─ components/
│  ├─ hooks/
│  └─ lib/
└─ styles/
   ├─ index.css
   └─ tokens.css
```

## Reglas

- no construir payload en JSX;
- importar contratos;
- preview usa `qr-core`;
- descarga final usa API;
- abortar requests viejos;
- no guardar WiFi en localStorage;
- errores accesibles;
- no regenerar binarios pesados por tecla.

## Tareas

### 1. Selector

- tarjetas o tabs;
- teclado;
- texto;
- iconos opcionales;
- mantener datos por tipo solo durante sesión.

### 2. Formularios

- validación inmediata;
- ejemplos;
- ayuda;
- campos condicionales;
- limpiar secretos.

### 3. Preview

- SVG;
- responsive;
- fondo;
- zoom;
- estado;
- placeholder accesible.

### 4. Opciones

- ECC;
- tamaño de exportación;
- margen;
- foreground/background;
- restaurar.

### 5. Validación

- local rápida;
- API antes de exportar;
- warning por densidad;
- bloquear overflow.

### 6. Descarga

- nombre seguro;
- SVG/GIF;
- liberar ObjectURL;
- feedback.

### 7. Responsive

Breakpoints basados en contenido.

### 8. SEO básico

- title;
- description;
- OpenGraph;
- canonical;
- robots según ambiente.

## Pruebas

- render por tipo;
- navegación teclado;
- errores;
- WiFi no persiste;
- download;
- cancelación;
- mobile viewport;
- E2E URL;
- E2E WiFi;
- E2E vCard.

## Criterios de aceptación

- flujo completo en móvil;
- sin scroll horizontal;
- preview coincide con descarga;
- exportación bloqueada si inválido;
- dos lectores escanean ejemplos;
- Lighthouse accesibilidad objetivo >= 90.

## Puerta de salida

- [ ] todos los tipos
- [ ] responsive
- [ ] a11y
- [ ] E2E
- [ ] preview/export parity
- [ ] reporte
