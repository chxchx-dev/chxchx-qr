# MVP-SCOPE — acore-qr

## 1. Declaración de alcance

El MVP es un generador de **QR estáticos** mobile-first, anónimo, sin base de datos, que produce resultados fiables y descargables desde el mismo motor que usa el backend.

## 2. Incluido en el MVP

### Tipos de contenido

- texto;
- URL (HTTP/HTTPS únicamente);
- correo;
- teléfono;
- SMS;
- WiFi;
- vCard;
- evento de calendario (iCalendar con envoltura VCALENDAR);
- ubicación (geo).

### Personalización

- selección de nivel ECC (`low`, `medium`, `quartile`, `high`; defecto `medium`);
- colores seguros (foreground/background con contraste mínimo 4.5:1, sin combinaciones invertidas en MVP);
- margen mínimo (defecto 4 módulos);
- tamaño de exportación.

### Formatos y salida

- SVG (formato canónico de vista previa e impresión);
- GIF;
- PNG (servidor vía adaptador de rasterizado);
- vista previa responsive;
- descarga del archivo;
- copiar payload canónico;
- validación de escaneabilidad (estados `safe`, `dense`, `critical`, `overflow`).

### Plataforma

- API de renderizado `/api/v1/qr/render`;
- funcionamiento sin base de datos;
- idiomas: español e inglés (i18n desde el inicio);
- diseño dark-first (oscuro por defecto, modo claro disponible);
- sin necesidad de cuenta para el flujo principal.

## 3. Excluido del MVP

### Funcionalidad

- archivos convertidos en enlaces (Fase 05);
- QR dinámicos, URL cortas y redirección (Fase 06);
- cuentas, sesiones, historial, etiquetas (Fase 07);
- analítica y panel de administración (Fase 08);
- exportación con logo (Fase 04 habilita logo con ECC `high`);
- escáner de cámara;
- app móvil nativa;
- acortador público sin control;
- importación masiva.

### Arquitectura

- base de datos;
- Redis, colas, microservicios, Kubernetes;
- almacenamiento permanente de IP completa.

## 4. Límites numéricos del MVP

| Límite | Valor | Nota |
|---|---|---|
| Tamaño máximo de texto | **500 caracteres** | límite de producto; el límite real lo impone el encoder |
| Texto mínimo | 1 carácter no vacío | tras normalizar NFC |
| URL schemes | `https:`, `http:` | bloqueados `javascript:`, `data:`, `file:`, `vbscript:` |
| ECC por defecto | `medium` | `high` obligatorio si en Fase 04 se usa logo |
| Margen por defecto | 4 módulos | |
| Contraste | ≥ 4.5:1 (objetivo UI) | bloquear invertidas en MVP |
| Tamaño por defecto | 1024 px | |
| Colores por defecto | `#000000` / `#FFFFFF` | |

## 5. Criterios de aceptación del MVP

1. Un usuario anónimo genera un QR estático desde el móvil, lo descarga y lo escanea con al menos dos lectores distintos.
2. La vista previa y la descarga provienen del mismo motor (no difieren en márgenes, colores ni ECC).
3. Cada tipo de contenido produce un payload canónico validado y probado (round-trip).
4. El exceso de capacidad se rechaza con mensaje claro que sugiere usar un enlace.
5. No existe analítica de QR estáticos.
6. El QR personalizado que se exporta se decodifica de vuelta en pruebas.

## 6. Fuera de alcance declarado (honestidad)

- Los QR estáticos no son editables ni rastreables: se declara explícitamente en la UI.
- La exportación dice exactamente qué contiene el QR (dato directo o URL).
- No se afirma "privado" para contenidos públicos por naturaleza.
