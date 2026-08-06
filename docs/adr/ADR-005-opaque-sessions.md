# ADR-005 — Sesiones opacas

## Contexto

La Fase 07 introduce cuentas. El token interno Bearer de la Fase 06 se elimina y
la gestión de QR dinámicos pasa a autenticarse con la sesión del usuario. Se
necesita un mecanismo de sesión revocable, con rotación y sin token visible al
frontend.

## Fuerzas

- revocación inmediata (logout, sospecha de robo);
- no exponer el token al JavaScript del navegador;
- mínimo de dependencias;
- soporte de rotación de secretos gradual (docs/12 §12);
- resistencia a CSRF (SameSite + Origin check) y a session fixation.

## Opciones

1. **JWT firmado**: stateless, pero no revocable sin lista negra; expone
   claims al cliente; introduce criptografía de firma en runtime.
2. **Sesión opaca en DB**: token aleatorio 256 bits, hash SHA-256 en la DB,
   cookie HttpOnly; revocación trivial; el valor de la cookie se firma con
   HMAC (`SESSION_SECRET_CURRENT`/`PREVIOUS`) para rechazo temprano de cookies
   forjadas y rotación del secreto.
3. Cookie de sesión sin firma (solo token): más simple, pero sin la rotación
   de secretos documentada y sin rechazo temprano de basura.

## Decisión

**Sesión opaca persistida en PostgreSQL** (opción 2):

- token = 32 bytes `crypto.randomBytes`, base64url;
- la DB guarda `sha256(token)` (nunca el token original);
- cookie: `HttpOnly; SameSite=Lax; Secure` en producción; valor
  `token.firma` donde `firma = HMAC-SHA256(token, SESSION_SECRET_CURRENT)`;
  verificación probando `CURRENT` y `PREVIOUS` (rotación);
- rotación anti-fixation: cada login emite un token nuevo;
- revocación: logout y cambio de contraseña revocan sesiones;
- mutaciones autenticadas verifican el header `Origin` (CSRF).

## Consecuencias

- un volcado de la DB no permite reutilizar sesiones (solo hashes);
- el frontend nunca ve el token (cookie HttpOnly, sin localStorage);
- coste: un índice por `token_hash` y un lookup por request;
- `SESSION_SECRET_CURRENT` es obligatoria con `DYNAMIC_QR_ENABLED=true`;
  `SESSION_SECRET_PREVIOUS` habilita rotación sin invalidar sesiones.

## Plan de migración

- migración `0005_create_sessions` + columna `owner_user_id`/`actor_user_id`
  en `0006`;
- rotación de `SESSION_SECRET`: mover current→previous, generar nuevo current,
  desplegar, esperar expiración de sesiones, eliminar previous.

## Fecha y estado

2026-08-06 · accepted
