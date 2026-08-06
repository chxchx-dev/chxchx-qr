# Fase 07 — Cuentas, Sesiones e Historial

## Objetivo

Asignar recursos a usuarios y ofrecer gestión segura.

## Resultado

Registro, login, logout, sesión, historial, edición y eliminación autorizada.

## Fuera de alcance

- OAuth;
- MFA;
- equipos;
- pagos;
- SSO.

## Archivos

```text
apps/api/src/infrastructure/database/migrations/
├─ 0004_create_users.sql
├─ 0005_create_sessions.sql
└─ 0006_assign_dynamic_qr_owner.sql

apps/api/src/modules/auth/
├─ auth.routes.ts
├─ auth.controller.ts
├─ auth.service.ts
├─ user.repository.ts
├─ session.repository.ts
├─ password.ts
├─ session-token.ts
├─ auth.middleware.ts
├─ origin.middleware.ts
└─ auth.errors.ts

apps/api/src/modules/users/
├─ users.routes.ts
├─ users.controller.ts
└─ users.service.ts

apps/web/src/features/auth/
├─ LoginPage.tsx
├─ RegisterPage.tsx
├─ auth-api.client.ts
├─ auth-context.tsx
└─ RequireAuth.tsx

apps/web/src/features/dashboard/
├─ DashboardPage.tsx
├─ QrList.tsx
├─ QrDetailPage.tsx
├─ QrEditForm.tsx
└─ QrDeleteDialog.tsx
```

## Tareas

### 1. Password

- scrypt;
- salt;
- parámetros versionados;
- comparación timing safe;
- policy;
- no logs.

### 2. Sesión

- token 256 bits;
- hash DB;
- cookie;
- rotation;
- revoke;
- expiry;
- session listing opcional.

### 3. Origin/CSRF

- verify Origin;
- SameSite;
- CORS;
- no auth token en localStorage.

### 4. Ownership

Toda consulta incluye owner.

Incorrecto:

```sql
SELECT * FROM dynamic_qrs WHERE id = $1
```

Correcto:

```sql
SELECT * FROM dynamic_qrs WHERE id = $1 AND owner_user_id = $2
```

### 5. Historial

- paginación;
- búsqueda;
- estado;
- tags futuro;
- duplicar;
- editar;
- eliminar.

### 6. Migración

Recursos previos deben:

- asignarse a cuenta interna;
- permanecer anónimos;
- o migrarse según decisión.

## Pruebas

- register;
- duplicate email;
- login;
- wrong password;
- session fixation;
- cookie flags;
- logout;
- expired;
- CSRF;
- resource isolation;
- enumeration;
- delete;
- pagination.

## Criterios de aceptación

- usuario A no ve B;
- sesión revocable;
- contraseña segura;
- frontend no guarda token;
- mutaciones verifican Origin;
- historial funciona.

## Puerta de salida

- [ ] auth
- [ ] sessions
- [ ] ownership
- [ ] history
- [ ] isolation tests
- [ ] reporte
