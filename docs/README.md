# QR Studio — Paquete de Orquestación y Arquitectura

> Documentación maestra para construir un generador profesional de códigos QR con **React + Vite + TypeScript** en el frontend y **Node.js + Express + TypeScript** en el backend, usando un conjunto controlado de dependencias y una evolución por fases.

## 1. Propósito

Este paquete no es una lista de ideas. Es el contrato de construcción del proyecto.

Define:

- qué se construye y qué queda fuera;
- cómo se divide el sistema;
- qué archivos debe crear cada fase;
- qué reglas no se pueden romper;
- cómo se validan seguridad, rendimiento y escaneabilidad;
- cuándo una fase puede declararse terminada;
- cómo evolucionar desde QR estáticos hasta QR dinámicos, historial, archivos y analítica.

## 2. Correcciones críticas al planteamiento inicial

### 2.1 Un archivo grande no se codifica dentro del QR

Un QR estándar admite aproximadamente **3 KB o menos de datos binarios en su máxima capacidad**, y esa cifra disminuye al subir el nivel de corrección de errores.

Por tanto:

- texto, URL, WiFi, vCard y eventos sí pueden codificarse directamente;
- imágenes, PDF, audio, scripts y otros archivos no deben incrustarse como binario;
- el archivo se almacena y el QR contiene una URL HTTPS de acceso o descarga;
- los ejecutables y scripts quedan bloqueados por defecto;
- nunca se ejecuta, interpreta ni previsualiza código subido por usuarios.

### 2.2 El backend será la fuente oficial del resultado

El frontend puede mostrar una previsualización inmediata, pero el resultado descargable debe provenir del mismo motor y de las mismas reglas que usa el backend.

Esto evita:

- colores o márgenes distintos entre vista previa y descarga;
- niveles ECC incompatibles;
- QR que se ven bien pero no se escanean;
- comportamientos diferentes entre navegador y servidor.

### 2.3 `qr` es el paquete npm

La librería de Paul Miller se instala desde npm como:

```bash
npm install qr
```

El paquete soporta generación en SVG, GIF, matriz cruda y otros formatos. Para PNG en servidor se define un adaptador explícito; no se asume que el entorno Node dispone de DOM o Canvas.

### 2.4 QR estático y QR dinámico son productos diferentes

- **QR estático:** contiene directamente el destino. No se puede modificar ni rastrear sin cambiar el código.
- **QR dinámico:** contiene una URL corta controlada por la plataforma. La plataforma redirige al destino real, permite editarlo y puede registrar escaneos.

La analítica solo existe de forma fiable para QR dinámicos.

## 3. Orden obligatorio de lectura

1. [`00-ORCHESTRATOR.md`](./00-ORCHESTRATOR.md)
2. [`01-VISION-SCOPE.md`](./01-VISION-SCOPE.md)
3. [`02-ARCHITECTURE.md`](./02-ARCHITECTURE.md)
4. [`03-GLOBAL-RULES.md`](./03-GLOBAL-RULES.md)
5. [`04-DOMAIN-CONTENT-TYPES.md`](./04-DOMAIN-CONTENT-TYPES.md)
6. [`05-API-CONTRACTS.md`](./05-API-CONTRACTS.md)
7. [`06-DATA-MODEL.md`](./06-DATA-MODEL.md)
8. [`07-SECURITY-FILE-POLICY.md`](./07-SECURITY-FILE-POLICY.md)
9. [`08-UX-ACCESSIBILITY.md`](./08-UX-ACCESSIBILITY.md)
10. [`09-TESTING-QUALITY.md`](./09-TESTING-QUALITY.md)
11. [`10-DEPLOYMENT-OBSERVABILITY.md`](./10-DEPLOYMENT-OBSERVABILITY.md)
12. [`11-DEPENDENCY-POLICY.md`](./11-DEPENDENCY-POLICY.md)
13. [`12-ENVIRONMENT-CONFIG.md`](./12-ENVIRONMENT-CONFIG.md)
14. [`13-DECISIONS-AND-RISKS.md`](./13-DECISIONS-AND-RISKS.md)
15. Fases en [`phases/`](./phases/)
16. Checklists en [`checklists/`](./checklists/)

## 4. Fases

| Fase | Resultado |
|---|---|
| 00 | Decisiones de producto cerradas y alcance congelado |
| 01 | Monorepo, calidad base, configuración y contenedores |
| 02 | Motor QR compartido, validado y expuesto por API |
| 03 | Generador web estático mobile-first |
| 04 | Personalización, logo, exportación y preparación para impresión |
| 05 | Archivos convertidos en enlaces seguros |
| 06 | QR dinámicos, PostgreSQL y redirección |
| 07 | Cuentas, sesiones, historial y gestión de QR |
| 08 | Analítica, panel y controles administrativos |
| 09 | Hardening, observabilidad, despliegue y lanzamiento |

## 5. Jerarquía de autoridad

Cuando dos documentos parezcan contradecirse, se usa este orden:

1. reglas de seguridad;
2. decisiones ADR aprobadas;
3. reglas globales;
4. contrato de API;
5. documento de fase;
6. implementación.

El código no puede utilizarse como excusa para contradecir la documentación. Si una decisión cambia, se actualiza primero el ADR y después el código.

## 6. Definición real de terminado

Una fase no termina porque “funciona en mi máquina”.

Termina cuando:

- compila sin errores;
- pasa pruebas unitarias, integración y las pruebas exigidas por la fase;
- no deja `TODO`, mocks permanentes ni rutas sin proteger;
- actualiza documentación y configuración;
- cumple los criterios de aceptación;
- supera la checklist de definición de terminado;
- incluye instrucciones de ejecución y rollback;
- no introduce una dependencia no autorizada.

## 7. Entregables incluidos

- Orquestador maestro.
- Arquitectura completa.
- Reglas de código, seguridad y dependencias.
- Contratos de API.
- Modelo de datos futuro.
- Política de archivos.
- Diseño UX mobile-first.
- Estrategia de pruebas.
- Despliegue y observabilidad.
- Nueve fases con archivos exactos y criterios de salida.
- Plantillas de ejecución y cierre.
- Checklist de release.
