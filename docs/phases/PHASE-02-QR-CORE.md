# Fase 02 — Motor QR y API Estática

## Objetivo

Construir el núcleo compartido que transforma contenido tipado en payload canónico y lo renderiza de forma verificable.

## Resultado

La API valida y exporta SVG/GIF. El paquete puede usarse también desde la web.

## Fuera de alcance

- UI completa;
- logos;
- PNG servidor;
- archivos;
- DB;
- dinámicos.

## Archivos

```text
packages/contracts/src/
├─ qr-content.schema.ts
├─ qr-options.schema.ts
├─ qr-response.schema.ts
├─ problem.schema.ts
├─ error-codes.ts
└─ index.ts

packages/qr-core/src/
├─ domain/
│  ├─ qr-content.ts
│  ├─ qr-options.ts
│  ├─ qr-errors.ts
│  └─ qr-result.ts
├─ builders/
│  ├─ text.builder.ts
│  ├─ url.builder.ts
│  ├─ email.builder.ts
│  ├─ phone.builder.ts
│  ├─ sms.builder.ts
│  ├─ wifi.builder.ts
│  ├─ vcard.builder.ts
│  ├─ calendar.builder.ts
│  ├─ geo.builder.ts
│  └─ index.ts
├─ validation/
│  ├─ capacity.ts
│  ├─ contrast.ts
│  └─ schemes.ts
├─ renderers/
│  ├─ qr-encoder.adapter.ts
│  ├─ svg.renderer.ts
│  ├─ gif.renderer.ts
│  └─ raw.renderer.ts
├─ services/
│  ├─ build-canonical-payload.ts
│  ├─ validate-qr.ts
│  └─ render-qr.ts
└─ index.ts

apps/api/src/modules/qr/
├─ qr.routes.ts
├─ qr.controller.ts
├─ qr.service.ts
└─ qr.http-errors.ts
```

## Tareas

### 1. Contratos

- discriminated union por `type`;
- límites;
- defaults;
- formato;
- error codes;
- transformaciones solo donde sean transparentes.

### 2. Builders

Cada builder:

- recibe DTO validado;
- escapa;
- normaliza;
- produce string;
- no conoce HTTP;
- tiene fixtures.

### 3. Encoder

Wrapper único:

```ts
encodeMatrix(payload, options)
renderSvg(...)
renderGif(...)
```

No exponer la API de `qr` al resto.

### 4. Capacidad

- capturar overflow del encoder;
- clasificar densidad;
- recomendar ECC/tamaño;
- rechazar antes de agotar CPU cuando sea posible.

### 5. Contraste

- parsear hex;
- calcular luminancia;
- bloquear contraste insuficiente;
- foreground oscuro en MVP.

### 6. API

- `/qr/validate`;
- `/qr/render`;
- streaming;
- headers;
- filename;
- request ID;
- Problem Details.

### 7. Seguridad SVG

- SVG generado internamente;
- sin scripts;
- sin enlaces;
- sin foreignObject;
- colores validados.

## Pruebas

### Unitarias

Todos los builders y escapes.

### Round-trip

- encode;
- decode;
- comparar.

### API

- 200 SVG;
- 200 GIF;
- 422 overflow;
- 400 schema;
- 415 format;
- headers.

### Fuzz básico

Strings Unicode aleatorios bajo límite no deben colgar el proceso.

## Criterios de aceptación

- un payload tiene una sola forma canónica;
- el resultado se decodifica;
- frontend y API pueden importar el paquete;
- no hay import directo de `qr` fuera del adapter;
- SVG seguro;
- errores estables.

## Puerta de salida

- [ ] contratos publicados internamente
- [ ] todos los tipos iniciales
- [ ] round-trip verde
- [ ] endpoints documentados
- [ ] coverage objetivo
- [ ] reporte
