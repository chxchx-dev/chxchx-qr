# 09 — Pruebas y Calidad

## 1. Objetivo

Demostrar tres cosas:

1. el payload es correcto;
2. el archivo generado es válido;
3. el QR se puede volver a leer.

## 2. Capas

### Unitarias

- builders;
- escaping;
- normalización;
- validación;
- contraste;
- cálculo de límites;
- nombres seguros;
- slugs;
- hashes.

### Integración

- API + qr-core;
- API + storage;
- API + PostgreSQL;
- sesiones;
- migraciones;
- redirección.

### E2E

- generar URL;
- descargar SVG;
- personalizar;
- subir archivo;
- crear dinámico;
- editar destino;
- escanear/redirigir;
- consultar analítica.

## 3. Vectores QR

Casos obligatorios:

- ASCII;
- acentos;
- emoji;
- árabe o texto RTL;
- URL con query;
- URL larga;
- WiFi con `;`, `:` y `\`;
- vCard con comas;
- calendario UTC;
- texto multilínea;
- payload cerca del límite;
- overflow;
- colores inválidos;
- logo grande.

## 4. Round-trip

Para cada fixture:

```text
input -> canonical payload -> encode -> decode -> compare
```

El valor decodificado debe ser igual al payload canónico.

## 5. Exportadores

### SVG

Validar:

- XML válido;
- dimensiones;
- viewBox;
- margen;
- colores;
- ausencia de scripts;
- ausencia de referencias externas.

### GIF

Validar:

- firma;
- dimensiones;
- lectura por decoder;
- contenido.

### PNG

Validar:

- firma;
- dimensiones;
- alpha esperado;
- lectura;
- logo;
- densidad.

## 6. API

Casos:

- body vacío;
- JSON malformado;
- tipo desconocido;
- URL peligrosa;
- payload grande;
- formato no soportado;
- tamaño fuera de rango;
- rate limit;
- cancelación;
- timeout;
- request ID;
- headers.

## 7. Archivos

- extensión falsa;
- MIME falso;
- firma falsa;
- archivo truncado;
- archivo grande;
- doble extensión;
- SVG disfrazado;
- nombre Unicode;
- traversal;
- error durante storage;
- cleanup;
- antivirus pendiente;
- descarga expirada.

## 8. Dinámicos

- slug inexistente;
- activo;
- pausado;
- expirado;
- bloqueado;
- destino actualizado;
- concurrencia;
- evento no bloquea redirect;
- bot;
- rate limit;
- idempotencia.

## 9. Seguridad

- XSS en nombre;
- CRLF en filename;
- SQL injection;
- acceso a QR ajeno;
- fijación de sesión;
- CSRF;
- cookie flags;
- brute force;
- open redirect controlado;
- path traversal;
- content sniffing.

## 10. Rendimiento

Objetivos iniciales orientativos:

| Operación | Objetivo |
|---|---|
| validar p95 | < 100 ms |
| render SVG p95 | < 250 ms |
| render PNG p95 | < 800 ms |
| redirect p95 app | < 100 ms sin contar red |
| home LCP móvil | < 2.5 s |
| bundle inicial | revisar en CI |

Los objetivos se ajustan con mediciones.

## 11. Cobertura

Umbral inicial:

```text
statements: 85%
branches: 80%
functions: 85%
lines: 85%
```

`qr-core`, auth y seguridad deben apuntar más alto.

No perseguir cobertura con pruebas inútiles.

## 12. Calidad estática

Gates:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm run test:e2e
```

## 13. Compatibilidad

Navegadores:

- últimas dos versiones estables de Chrome;
- Edge;
- Firefox;
- Safari;
- Safari iOS;
- Chrome Android.

Escáneres:

- cámara Android;
- cámara iOS;
- al menos una app de terceros;
- decoder automatizado.

## 14. Regresión visual

Usar para UI, no para determinar que el QR funciona.

Capturas:

- móvil pequeño;
- móvil grande;
- desktop;
- dark mode si existe;
- error;
- warning;
- loading.

## 15. Datos de prueba

- no usar correos reales;
- no usar contraseñas reales;
- no subir documentos reales;
- fixtures generados;
- limpiar DB y storage después.
