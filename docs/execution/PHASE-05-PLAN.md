# PHASE-05-PLAN — Archivos como Enlaces Seguros

> Fuente de verdad: `docs/phases/PHASE-05-FILE-LINKS.md`. Estado: **DONE** (2026-08-06, ver `PHASE-05-REPORT.md`).

## Objetivo

Permitir subir un archivo permitido (PNG/JPEG/WebP/PDF/txt), almacenarlo localmente con token opaco y TTL, y generar un QR cuya URL apunta a `{FILE_PUBLIC_BASE_URL}/f/{token}` (ADR-003). El binario nunca entra en el payload del QR: la API devuelve una URL de descarga con `Content-Disposition: attachment`, `nosniff` y `CSP: sandbox`. Cleanup periódico de expirados, huérfanos y temporales.

## Fuera de alcance (confirmado)

Ejecutables, scripts, ZIP, HTML/SVG, almacenamiento ilimitado, QR dinámico editable, cuentas obligatorias, storage S3 (el factory falla con mensaje claro: requiere ADR y credenciales; solo `local` en esta fase), texto `text/plain` deshabilitable en producción.

## Decisiones de diseño

| Decisión | Detalle |
|---|---|
| URL del QR | Siempre `https://.../f/{token}`: el QR contiene la URL, nunca el binario (ADR-003). El tipo web "Archivo" construye el DTO `{ type: "url", url }` reutilizando todo el pipeline de URL existente. |
| Token | `crypto.randomBytes(24).toString("base64url")`: opaco, no adivinable, nunca es el storage key ni el nombre original. |
| Storage local | `{FILE_TEMP_DIR}/storage/`: archivo binario `{token}.bin` + sidecar `{token}.json` con metadata (mime validado, nombre sanitizado, tamaño, sha256, createdAt, expiresAt, status). Interfaz `FileStorage` inyectable (tests con fake). |
| Storage factory | `FILE_STORAGE_DRIVER=local` por defecto; `s3` lanza `Error("requiere ADR")`. Solo local en esta fase (producción: ADR de proveedor). |
| Firma mágica | Detección propia y testeada (`file-signature.ts`): PNG/JPEG/WebP/PDF por bytes mágicos, `text/plain` por heurística de texto (sin NUL, ratio de imprimibles). Nunca se confía en MIME del browser ni extensión. |
| Secuencia de validación | límite HTTP/multer → firma mágica → MIME permitido → extensión coherente (bloqueada si `.exe .svg .zip …`) → hash SHA-256 → re-encode de imágenes con sharp (elimina metadata; PDF/txt se almacenan tal cual) → storage → estado `clean` → URL. |
| Descarga | `GET /f/:token`: headers `Content-Type` validado, `Content-Disposition: attachment; filename="safe.ext"` (RFC 5987 filename*), `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, `Cache-Control: private, max-age=300`. 404 si no existe, 410 si expiró (y se borra). Sin listing. |
| Estado | `pending` (temp durante subida) → `clean` → `expired`/`deleted`; `blocked` cuando la validación falla (el temp se elimina). Sidecar persiste `status`. |
| Multer | Ya en ^2.2.0 (parcheado): diskStorage a `{FILE_TEMP_DIR}/uploads` con nombre `randomUUID`, `limits.fileSize = FILE_MAX_BYTES`, `files: 1`, `fields: 0`, `limits.fields` bajo; errores traducidos (413/415/400). Cleanup con `finally`. |
| Cleanup | `file-cleanup.ts`: job con `setInterval` (intervalo configurable, por defecto 60 min): borra expirados (sidecar), huérfanos (binario sin sidecar o viceversa), y temporales >1h (pending/blocked). Arranca en `server.ts` y se para en shutdown. Documentado. |
| Rate limit | Rutas separadas (docs/07 §11): `POST /api/v1/files` muy bajo (por hora), `GET /f/:token` alto (por minuto). 429 `FILE_RATE_LIMITED`. Reutiliza `createRateLimiter` con código de error configurable. |
| TTL | `FILE_ANONYMOUS_TTL_HOURS` (defecto 168 = 7 días). `expiresAt = createdAt + TTL`. `0` expira inmediatamente (útil en tests). |
| Re-encode de imágenes | PNG/JPEG/WebP: decodificar con sharp (valida que es imagen real, `limitInputPixels`), `rotate()` y re-encode al mismo formato sin metadata. Si falla → 415. |
| UI | El tipo "Archivo" aparece en el selector solo si `VITE_FILE_UPLOAD_ENABLED=true` (web-config). FileResult muestra URL, expiración, botones copiar/eliminar y la advertencia "el QR contiene un enlace, no el archivo". Progreso de subida con XHR. |

## Archivos por crear

```text
docs/execution/PHASE-05-PLAN.md ✅
packages/contracts/src/{file-upload.schema,file-response.schema}.ts
apps/api/src/modules/files/{files.routes,files.controller,files.service,upload.middleware,file-policy,file-signature,filename,file-cleanup,file-download.controller,file-errors}.ts
apps/api/src/infrastructure/storage/{file-storage,local-file-storage,storage-factory}.ts
apps/api/test/files.test.ts
apps/web/src/features/files/{FileUploadField,FileUploadProgress,FileResult}.tsx
apps/web/src/features/files/{file-api.client.ts,useFileUpload.ts}
apps/web/test/e2e/files.spec.ts + fixtures/sample.pdf
docs/execution/PHASE-05-REPORT.md
```

## Archivos por modificar

- `packages/contracts/src/{error-codes,index}.ts` (códigos `FILE_*` + exports)
- `packages/config/src/api-config.ts` (FILE_*), `apps/web/src/...` (`generator.types.ts`, `lib/build-dto.ts`, `components/{GeneratorForm,GeneratorScreen,ContentTypeSelector}.tsx`, `shared/lib/messages.ts`)
- `apps/api/src/{app.ts,server.ts}` (montar rutas + job cleanup)
- `.env.example` (raíz y `apps/api/`), `compose.yaml`
- Docs: `05-API-CONTRACTS.md`, `12-ENVIRONMENT-CONFIG.md`, `PHASE-05-FILE-LINKS.md` (checklist)

## Orden de tareas

1. Plan + contracts (schemas + códigos) + tests contracts.
2. Config (FILE_*) + tests config.
3. Storage (interfaz, local, factory).
4. API files (policy/signature/filename/errors/middleware/service/controllers/routes/cleanup) + wiring.
5. Tests API.
6. Web: cliente + hook + componentes + integración generador.
7. Tests web (unit + E2E).
8. Docker (env + smoke).
9. Gates completos + revisión.
10. Reporte + docs.

## Pruebas

- upload válido por tipo (PNG/JPEG/WebP/PDF/txt) → 200 con `{token,url,fileName,sizeBytes,mimeType,expiresAt}`;
- tipo bloqueado (SVG, EXE, ZIP) → 415; demasiado grande → 413; firma inválida → 415;
- extensión incoherente (PNG con `.exe`) → 415; `text/plain` con binario → 415;
- descarga: headers (attachment, nosniff, sandbox), 404 token inválido, 410 expirado (TTL=0);
- cleanup borra expirados/huérfanos/temporales; storage caído → 503;
- doble request → tokens distintos; rate limit upload (429);
- E2E: subir → URL + aviso → preview → descargar QR.

## Criterios de aceptación (de la fase)

- [ ] ningún archivo se sirve por nombre original;
- [ ] tipos bloqueados fallan;
- [ ] temp se limpia;
- [ ] expiración funciona;
- [ ] QR contiene URL;
- [ ] la UI no dice "archivo dentro del QR".

## Riesgos

- `text/plain` como vector (scripts): se bloquea por extensión en la lista de bloqueados (`.js .sh …`) y puede deshabilitarse en producción;
- re-encode de imágenes cambia bytes: se re-calcula hash y tamaño después del re-encode;
- storage local no persiste en contenedor: volumen nombrado como deuda (producción: driver con ADR).
