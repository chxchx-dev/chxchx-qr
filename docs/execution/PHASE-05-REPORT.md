# PHASE-05-REPORT — Archivos como Enlaces Seguros (cerrada)

> Estado: **DONE** · Fecha: 2026-08-06 · Fuente: `docs/phases/PHASE-05-FILE-LINKS.md` · Plan: `PHASE-05-PLAN.md` · ADR: `ADR-003-file-as-url.md`

## Resumen

La plataforma ahora permite subir un archivo permitido (PNG/JPEG/WebP/PDF/texto), validarlo por **firma mágica**, almacenarlo localmente con **token opaco** y TTL, y generar un QR cuya URL apunta a `{FILE_PUBLIC_BASE_URL}/f/{token}` (ADR-003). El binario **nunca** entra en el payload del QR. La descarga es siempre `attachment` con `nosniff` y `CSP: sandbox`; el cleanup periódico borra expirados, huérfanos y temporales. La API se completó primero; esta pasada cierra la parte web (tipo "Archivo" en el generador, subida con progreso y cancelación), el E2E, Docker, la documentación y el reporte.

## Puerta de salida

| Criterio | Estado |
|---|---|
| Multer parcheado (^2.2.0) | ✅ `apps/api/package.json`, límites de archivo/tamaño y errores traducidos (413/415/400) |
| Firma real (no MIME del browser) | ✅ `file-signature.ts` (PNG/JPEG/WebP/PDF por bytes mágicos + heurística de texto) + tests API |
| Storage adapter | ✅ `FileStorage` inyectable + `storage-factory.ts` (`local`; `s3` lanza error "requiere ADR") |
| TTL | ✅ `FILE_ANONYMOUS_TTL_HOURS`, `expiresAt` en sidecar, `410 FILE_EXPIRED` en descarga |
| Cleanup | ✅ `file-cleanup.ts` (expirados/huérfanos/temporales), arrancado en `server.ts`, parado en shutdown |
| E2E | ✅ `apps/web/test/e2e/files.spec.ts` (3 tests: flujo completo, quitar, tipo bloqueado) + fixture `sample.pdf` |
| Reporte | ✅ este archivo |

## Evidencia verificable

| Gate | Resultado |
|---|---|
| lint / format / typecheck | ✅ Biome limpio en todo el repo (170 archivos, 0 errores); TS estricto por workspace |
| tests | ✅ **171/171** (53 API + 28 web + 12 config + 12 contracts + 66 qr-core) |
| E2E | ✅ **10/10** (Chromium + móvil), incluye **3 tests nuevos de archivos** (subida→URL→preview→descarga, quitar, SVG bloqueado) |
| build | ✅ Vite 476 KB JS / 19.8 KB CSS (3.7 s) + `tsc --noEmit` de la web |
| Docker | ✅ `Dockerfile.web` con `ARG VITE_FILE_UPLOAD_ENABLED`; `compose.yaml` con env `FILE_*` y volumen nombrado `file-storage` |

## Decisiones clave (con evidencia)

- **URL como contenido**: el tipo web "Archivo" construye el DTO `{ type: "url", url }` reutilizando todo el pipeline de URL existente (validación, preview, exportación) — el QR contiene la URL pública, nunca el binario (ADR-003).
- **Subida con progreso vía XHR**: `fetch` no expone `upload.onprogress`; `file-api.client.ts` usa `XMLHttpRequest` con progreso 0-100, cancelación por `AbortSignal` y traducción de errores `application/problem+json` → `FileApiError`.
- **La API es la autoridad**: la UI solo adelanta errores de cliente (tamaño >10 MB y extensión bloqueada, reutilizando `FILE_UPLOAD_LIMITS` del contrato); la validación final (firma mágica, extensión coherente, re-encode de imágenes) vive en la API.
- **Flag público coherente**: `VITE_FILE_UPLOAD_ENABLED` default `true` en `web-config` (igual que `FILE_UPLOAD_ENABLED` de la API) y **leído en runtime vía `webConfig(import.meta.env)`** — el default aplica de verdad en el navegador, no solo en el build. Producción puede apagarlo.
- **Docker demo-listable**: el build web hornea el flag vía `ARG`; la API en compose monta `FILE_TEMP_DIR` en un volumen nombrado (el storage local no persiste sin volumen).

## Hallazgos del revisor aplicados

- 🟠 **MEDIA — el default de `web-config` no aplicaba en runtime**: `GeneratorScreen` leía `import.meta.env.VITE_FILE_UPLOAD_ENABLED` crudo (default de facto `false` en dev). Ahora se lee vía `webConfig(import.meta.env).VITE_FILE_UPLOAD_ENABLED`, coherente con la API.
- 🟠 **MEDIA — race de abort en `useFileUpload`**: el catch de una subida vieja abortada reseteaba el estado a `idle`, pisando el estado de una subida nueva en vuelo. Guard añadido: `abortRef.current === controller` antes de tocar el estado (mismo espíritu que `useLogoPreview`).
- 🟢 **BAJA — strings mágicos de códigos**: `clientSideFileError` devuelve ahora `ErrorCodes.FILE_TOO_LARGE` / `ErrorCodes.FILE_TYPE_NOT_ALLOWED` del contrato en lugar de literales.
- 🟢 **BAJA — listener de abort del XHR sin limpiar**: se remueve en `onload/onerror/onabort` (evita llamar `xhr.abort()` sobre un XHR terminado).
- 🟢 **BAJA — cancelación sin UI**: el plan exigía cancelación; se añade botón "Cancelar" durante la subida (aborta el XHR y vuelve a `idle`).
- 🟢 **BAJA — tono de la advertencia**: `FileResult` usa ahora `text-amber-400`/`border-amber-400/40`, consistente con `ScannabilityBadge` y `ValidationSummary`.
- 🟢 **BAJA — deuda de lint previa en la API**: los archivos del módulo `files/` (creados antes de esta pasada) no pasaban Biome (20 errores: formato, orden de imports, `noControlCharactersInRegex`). Corregido en lote; el regex de control chars se sustituyó por `stripControlCharacters()` (filtrado por code point, testeable).

## Deuda aceptada (documentada)

| Deuda | Condición de resolución |
|---|---|
| Storage local en `/tmp` sin volumen en contenedores | Volumen nombrado añadido en `compose.yaml`; producción: driver S3 con ADR (el factory ya lo exige) |
| `text/plain` activo por defecto | Deshabilitable vía `FILE_ALLOWED_TYPES`/`FILE_UPLOAD_ENABLED=false` en producción (documentado en `docs/12`) |
| Rate limit por proceso (token bucket en memoria) | Fase multi-proceso / Redis (documentado en `docs/12`) |
| i18n es/en | Fase posterior; texto centralizado en `shared/lib/messages.ts` |

## Archivos clave

- **Web (nuevo)**: `features/files/{file-api.client,useFileUpload,FileUploadField,FileUploadProgress,FileResult}.ts(x)`.
- **Web (modificado)**: `features/generator/{generator.types,build-dto,ContentTypeSelector,GeneratorScreen}.ts(x)`, `shared/lib/messages.ts` (`ui.types.file` + `ui.files`), `test/build-dto.test.ts`, `test/e2e/{files.spec.ts, mobile.spec.ts}`, `test/e2e/fixtures/sample.pdf`, `scripts/e2e.sh`.
- **Config**: `web-config.ts` (default `true`), `web-config.test.ts`, `.env.example` (raíz, web, API).
- **Docker**: `Dockerfile.web` (ARG), `compose.yaml` (env `FILE_*` + volumen `file-storage`).
- **API (deuda de lint)**: `modules/files/{filename,file-cleanup,file-download.controller,file-policy,files.controller,files.routes,files.service,upload.middleware}.ts`, `infrastructure/storage/storage-factory.ts`, `server.ts`, `test/files.test.ts`.
- **Docs**: `05-API-CONTRACTS.md` (§7 contrato real + códigos `FILE_*`), `12-ENVIRONMENT-CONFIG.md` (§5), `PHASE-05-FILE-LINKS.md` (checklist ✅).

## Próximo paso permitido

**Fase 06 — QR dinámicos** (`docs/phases/PHASE-06-DYNAMIC-QR.md`): con archivos cerrados, el siguiente bloque es el QR dinámico editable (slug corto, redirección, activación/expiración), que requiere decidir persistencia (DB/Postgres) antes de implementar. La web ya tiene `VITE_DYNAMIC_QR_ENABLED=false` y la API `DYNAMIC_QR_ENABLED=false` previstos.
