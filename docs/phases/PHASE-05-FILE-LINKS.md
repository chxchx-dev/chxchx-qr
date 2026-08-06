# Fase 05 — Archivos como Enlaces Seguros

## Objetivo

Permitir subir un archivo permitido, almacenarlo y generar un QR con su URL.

## Resultado

La plataforma nunca incrusta el binario: entrega un enlace opaco, con expiración y borrado.

## Fuera de alcance

- ejecutables;
- scripts;
- ZIP;
- HTML/SVG;
- almacenamiento ilimitado;
- QR dinámico editable;
- cuentas obligatorias.

## Archivos

```text
apps/api/src/modules/files/
├─ files.routes.ts
├─ files.controller.ts
├─ files.service.ts
├─ upload.middleware.ts
├─ file-policy.ts
├─ file-signature.ts
├─ filename.ts
├─ file-cleanup.ts
├─ file-download.controller.ts
└─ file-errors.ts

apps/api/src/infrastructure/storage/
├─ file-storage.ts
├─ local-file-storage.ts
└─ storage-factory.ts

apps/web/src/features/files/
├─ FileUploadField.tsx
├─ FileUploadProgress.tsx
├─ FileResult.tsx
├─ file-api.client.ts
└─ useFileUpload.ts

packages/contracts/src/
├─ file-upload.schema.ts
└─ file-response.schema.ts
```

## Tareas

### 1. Multipart

- Multer >= 2;
- un archivo;
- límites;
- temp disk;
- errores;
- cleanup.

### 2. Firma

Implementar detección mínima y testeada o dependencia aprobada.

No confiar en:

- MIME del browser;
- extensión;
- nombre.

### 3. Storage

Local:

- solo desarrollo;
- fuera del árbol público;
- rutas opacas.

Producción:

- abrir ADR de proveedor;
- S3 compatible;
- bucket privado;
- URL firmada o proxy.

### 4. Token

La URL pública usa token aleatorio, no storage key.

### 5. Estado

```text
pending -> clean -> expired/deleted
        \-> blocked
```

### 6. Descarga

- attachment;
- nosniff;
- expiración;
- 404/410;
- no listing.

### 7. Cleanup

- temporales;
- expirados;
- fallos;
- huérfanos;
- job documentado.

### 8. UI

- tipos;
- tamaño;
- progreso;
- expiración;
- eliminar;
- advertencia de acceso por enlace.

## Pruebas

Todas las de política de archivos.

Además:

- upload -> URL -> QR -> download;
- token inválido;
- expirado;
- cleanup;
- storage caído;
- doble request;
- cancelación.

## Criterios de aceptación

- [x] ningún archivo se sirve por nombre original (token opaco de 24 bytes);
- [x] tipos bloqueados fallan (firma mágica + extensión, tests API);
- [x] temp se limpia (job `file-cleanup.ts` + test de expirados/huérfanos);
- [x] expiración funciona (410 `FILE_EXPIRED`, TTL=0 en tests);
- [x] QR contiene URL (la web construye `{type:"url",url}` con la URL pública);
- [x] la UI no dice “archivo dentro del QR” (advertencia explícita en `FileResult`).

## Puerta de salida

- [x] Multer parcheado (`^2.2.0`)
- [x] firma real (`file-signature.ts`, PNG/JPEG/WebP/PDF + heurística texto)
- [x] storage adapter (`FileStorage` inyectable, factory `local`; `s3` exige ADR)
- [x] TTL (`FILE_ANONYMOUS_TTL_HOURS`, `expiresAt` en el sidecar)
- [x] cleanup (`file-cleanup.ts`, arranque/parada en `server.ts`)
- [x] E2E (`apps/web/test/e2e/files.spec.ts` + fixture `sample.pdf`)
- [x] reporte (`docs/execution/PHASE-05-REPORT.md`)
