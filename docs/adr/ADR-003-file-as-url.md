# ADR-003 — Archivos mediante URL en lugar de binario incrustado
> **Registro histórico:** la función de este ADR está fuera del alcance vigente desde ADR-009. Se conserva como antecedente, no como guía de implementación actual.

## Estado

`accepted`

## Fecha

2026-08-05

## Contexto

Un QR estándar admite aproximadamente 3 KB o menos de datos binarios en su máxima capacidad, y menos aún con ECC alto. Imágenes, PDF, audio y otros archivos no caben en un QR fiable. Además, incrustar binario abriría la puerta a contenido ejecutable y a abusos. Se decide ahora porque define la política de archivos (Fase 05) y porque el MVP debe declarar explícitamente que los archivos no entran en el primer release.

## Fuerzas

- seguridad: nunca ejecutar, interpretar ni previsualizar contenido subido;
- capacidad: límite físico del formato QR;
- honestidad: el QR contiene un enlace, no el archivo;
- costo: almacenamiento simple con TTL;
- compatibilidad: la URL HTTPS funciona en cualquier lector.

## Opciones

### Opción A — Almacenar el archivo y codificar una URL HTTPS de acceso/descarga

Ventajas: el QR es pequeño y escaneable; el archivo puede expirar, revocarse o eliminarse; bloqueo por defecto de ejecutables y scripts; sin binario en el QR.
Desventajas: requiere backend con storage (Fase 05); el enlace puede romperse si el archivo expira.
Riesgos: abuso de hosting → mitigado con allowlist de tipos, re-encode de imágenes, límites y TTL.

### Opción B — Incrustar el binario en el QR

Ventajas: autónomo (no requiere servidor).
Desventajas: supera la capacidad real; QR ilegible o imposible de generar; riesgo de ejecución de contenido; tamaño inaceptable.
Riesgos: crítico — el producto se rompe por diseño.

### Opción C — No soportar archivos

Ventajas: MVP más simple.
Desventajas: descarta un caso de uso real del producto (menús, documentos, tarjetas); bloquea la evolución prevista en la visión.
Riesgos: producto incompleto frente a la competencia.

## Decisión

**Opción A.** El archivo se almacena de forma segura y el QR contiene una URL HTTPS de acceso o descarga (`https://.../f/{token}`). Los ejecutables y scripts quedan bloqueados por defecto. El binario nunca entra en el payload del QR. En el MVP (Fases 01–04) no hay carga de archivos: se declara como fuera de alcance y se implementa en la Fase 05.

## Consecuencias positivas

- QR pequeños y escaneables para archivos;
- posibilidad de expiración, revocación y borrado;
- superficie de seguridad controlada (allowlist, re-encode, límites).

## Consecuencias negativas

- dependencia de un servicio de almacenamiento y su disponibilidad;
- el enlace puede caducar (la UI debe mostrar expiración);
- no se puede afirmar "privado" si cualquiera con la URL accede.

## Riesgos y controles

- malware → allowlist de tipos + re-encode + antivirus si aplica;
- enlace roto → expiración visible y estado de archivo en la UI;
- abuso de hosting → límites de tamaño y TTL;
- secretos o scripts → bloqueados por defecto, sin ejecución.

## Plan de implementación

1. Fase 05: multipart con límite, validación de firma real, re-encode de imágenes, storage, URL HTTPS, expiración y eliminación.
2. Fase 05: el payload del QR es siempre `https://.../f/{token}`.
3. El MVP no implementa carga: queda fuera de alcance y documentado.

## Plan de salida

Si el almacenamiento cambiara (p. ej., a S3 compatible), se reemplaza solo el adaptador de storage; el contrato de URL y la política de archivos permanecen. Cambiar el esquema de URL requiere ADR nuevo.

## Referencias

- `docs/README.md` §2.1.
- `docs/04-DOMAIN-CONTENT-TYPES.md` §11.
- `docs/07-SECURITY-FILE-POLICY.md`.
- `docs/13-DECISIONS-AND-RISKS.md` ADR-003.
