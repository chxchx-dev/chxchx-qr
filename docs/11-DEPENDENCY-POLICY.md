# 11 — Política de Dependencias

## 1. Objetivo

Minimizar dependencias de runtime sin escribir criptografía, parsers complejos o procesamiento de imagen inseguro.

“Pocas dependencias” no significa reimplementar todo. Significa que cada dependencia paga su costo.

## 2. Baseline aprobado

### Root/dev

```text
typescript
@biomejs/biome
```

### Web

```text
react
react-dom
vite
@vitejs/plugin-react
tailwindcss
@tailwindcss/vite
zod
```

Opcional cuando el formulario lo requiera:

```text
react-hook-form
@hookform/resolvers
```

### API

```text
express
zod
qr
```

Fase archivos:

```text
multer >= 2
sharp
```

Fase DB:

```text
pg
```

Pruebas:

```text
vitest
playwright
```

Se pueden usar utilidades de Node para evitar paquetes innecesarios:

- `fetch`;
- `crypto`;
- `scrypt`;
- `URL`;
- `URLSearchParams`;
- `node:test`;
- `zlib`;
- streams.

## 3. Decisión sobre `qrcode.react`

No forma parte del baseline.

Razón:

- introduciría un segundo encoder;
- puede producir una matriz distinta;
- duplica reglas;
- aumenta pruebas de paridad.

La vista previa se construye con `packages/qr-core` y un componente SVG propio.

Solo se acepta si un ADR demuestra una ventaja concreta y se implementan pruebas de paridad.

## 4. Decisión sobre PNG

`qr` genera SVG, GIF y matriz. El PNG de servidor requiere un entorno de rasterizado.

Se aprueba `sharp` porque también resuelve:

- rasterizar SVG;
- redimensionar;
- re-encodear logos;
- remover metadata;
- producir PNG/WebP.

No añadir además Canvas, Jimp y otra librería gráfica.

## 5. Decisión sobre almacenamiento

No se instala SDK de cada proveedor desde el inicio.

Definir una interfaz pequeña:

```ts
interface FileStorage {
  put(input: PutFileInput): Promise<StoredFile>;
  getDownload(input: GetDownloadInput): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
}
```

Implementaciones:

- local para desarrollo;
- S3 compatible para producción cuando se elija proveedor.

El SDK entra mediante ADR.

## 6. Decisión sobre ORM

No usar ORM inicialmente.

PostgreSQL con `pg` y SQL explícito ofrece:

- menor superficie;
- control de consultas;
- migraciones auditables;
- menos magia.

Si el dominio crece y el costo supera el beneficio, se evalúa ORM con ADR.

## 7. Dependencias rechazadas por defecto

- librerías QR sin mantenimiento;
- múltiples librerías QR;
- paquetes de color triviales;
- paquetes para UUID si Node cubre el caso;
- `axios` si `fetch` cubre la necesidad;
- `moment`;
- librerías de lodash completas;
- paquetes de env sin necesidad;
- middleware que oculte seguridad;
- generadores de repositorio genérico;
- SDK cloud antes de elegir proveedor.

## 8. Evaluación

Plantilla:

```md
## Dependencia
Nombre y versión.

## Problema
Qué resuelve.

## Alternativas
Node nativo, código propio, otras librerías.

## Salud
Actividad, releases, issues.

## Seguridad
CVEs y postura.

## Licencia
Compatibilidad.

## Tamaño
Runtime y bundle.

## Decisión
Aceptar/rechazar.

## Salida
Cómo reemplazarla.
```

## 9. Versionado

- lockfile obligatorio;
- rangos controlados;
- parches automáticos con CI;
- majors revisados;
- no usar `latest` en Docker;
- guardar versión de Node;
- revisar release notes.

## 10. Auditoría trimestral

- dependencias no usadas;
- duplicados;
- vulnerabilidades;
- EOL;
- tamaño;
- licencias;
- oportunidad de eliminar.
