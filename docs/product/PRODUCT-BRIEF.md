# PRODUCT-BRIEF — acore-qr

> Nombre oficial del producto: **acore-qr** (decidido en Fase 00).
> La documentación maestra previa usaba "QR Studio" como nombre provisional.

## 1. Problema

Generar un código QR fiable no debería requerir herramientas de escritorio, cuentas ni conocimientos de formatos QR. Sin embargo, los generadores gratuitos suelen producir QR que:

- no se escanean por mala elección de ECC, margen o contraste;
- se ven distintos en la vista previa y en la descarga;
- no indican cuándo el contenido es demasiado grande para un QR fiable;
- no distinguen entre QR estático (fijo, no rastreable) y QR dinámico (URL corta, editable y rastreable).

## 2. Usuario principal

| Perfil | Necesidad principal |
|---|---|
| **Anónimo (móvil)** | Generar y descargar un QR estático sin crear cuenta, en menos de un minuto |
| Registrado (futuro) | Guardar, duplicar, editar y organizar sus QR |
| Negocio (futuro) | QR dinámicos, cambiar destinos, revisar escaneos |
| Administrador (futuro) | Controlar abuso, límites, destinos bloqueados y estado operativo |

El criterio de éxito inicial: un usuario anónimo genera un QR estático desde el móvil, lo descarga y lo escanea con al menos dos lectores distintos.

## 3. Propuesta de valor

Generador profesional de códigos QR **mobile-first, anónimo y honesto**:

- vista previa y descarga generadas por el mismo motor (`qr-core`);
- validación de escaneabilidad (capacidad, contraste, margen, ECC);
- contenido estático de verdad: el QR contiene el dato directo, sin rastreo;
- evolución preparada a QR dinámicos, archivos y cuentas sin rehacer el motor.

## 4. Acción principal

```text
Elegir tipo -> ingresar datos -> personalizar -> validar -> descargar o guardar
```

El usuario no necesita comprender versiones QR, máscaras ni codificaciones internas.

## 5. Estático vs dinámico

- **QR estático (MVP):** el payload contiene el destino o dato directamente. No se puede modificar ni rastrear sin cambiar el código. El producto no lo anuncia como editable ni rastreable.
- **QR dinámico (Fase 06):** el QR contiene una URL corta controlada por la plataforma que redirige al destino real, permitiendo edición y analítica. La analítica solo existe para QR dinámicos.

## 6. Límites del MVP

Incluido:

- tipos: texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario, ubicación;
- personalización segura: ECC, colores, tamaño, margen;
- formatos: SVG, GIF, PNG (servidor);
- vista previa responsive, descarga y copiar payload;
- API de renderizado (`POST /api/v1/qr/render`);
- funcionamiento sin base de datos;
- idiomas es/en, diseño dark-first.

Excluido del MVP (fases posteriores):

- archivos como enlace (Fase 05);
- QR dinámicos, PostgreSQL y redirección (Fase 06);
- cuentas, sesiones e historial (Fase 07);
- analítica y panel de administración (Fase 08).

## 7. Principios de producto

1. **Sin engaños:** un QR estático no se anuncia como editable ni rastreable.
2. **Sin descargas falsas:** el usuario sabe si el QR contiene el dato directo o una URL administrada por la plataforma.
3. **Escaneabilidad antes que estética:** no se permite una personalización que haga el QR inestable.
4. **Privacidad por defecto:** la analítica dinámica registra lo mínimo necesario.
5. **Exportación honesta:** resolución, formato y margen informados coinciden con el archivo generado.

## 8. Riesgos del producto y controles

| Riesgo | Control |
|---|---|
| **Phishing** (dominios usados como señuelo) | validación estricta de URLs (solo `https:`/`http:`), bloqueo de esquemas peligrosos, reportar abuso, política de bloqueo de destinos (Fase 08) |
| **Malware** (archivos usados como vector) | allowlist de tipos, re-encode de imágenes, bloqueo de ejecutables/scripts, sin ejecución de contenido subido (Fase 05) |
| **QR ilegible** (personalización que rompe la lectura) | límites de contraste y margen, estados de densidad, prueba de decodificación round-trip obligatoria |
| **Privacidad** (fuga o persistencia innecesaria) | MVP sin base de datos, contraseñas WiFi no persistidas, QR estáticos sin analítica, mínima recolección en dinámicos (Fase 08) |
| **Costos** (storage/CPU fuera de control) | sin storage en el MVP, límites y TTL desde Fase 05, PNG con límites y rate limit |
| **Dependencia** (librería crítica con riesgo) | motor único `qr-core` encapsulado, dependencias mínimas auditadas en CI, ADR antes de añadir cualquier dependencia |

> Matriz de riesgos maestra: `docs/13-DECISIONS-AND-RISKS.md` §2. Revisión obligatoria al cerrar cada fase.

## 9. Métricas de producto (MVP)

- porcentaje de generación exitosa;
- tiempo medio de vista previa;
- tiempo medio de exportación;
- errores de validación por tipo;
- tasa de QR que pasan pruebas de lectura;
- abandono del formulario.
