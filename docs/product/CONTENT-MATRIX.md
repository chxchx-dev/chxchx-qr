# Matriz de contenido

Los esquemas ejecutables viven en `packages/contracts/src/qr-content.schema.ts`; los builders, en `packages/qr-core/src/builders/`.

| Tipo | Payload canónico | Consideración |
|---|---|---|
| texto | texto NFC | conserva saltos de línea |
| URL | URL HTTP/HTTPS normalizada | sin credenciales |
| correo | `mailto:` | asunto/cuerpo opcionales |
| teléfono | `tel:` | la UI recomienda prefijo internacional |
| SMS | `sms:` | compatibilidad según lector y dispositivo |
| WiFi | `WIFI:` | escape de delimitadores; contraseña se codifica dentro del QR |
| vCard | vCard 3.0 | datos de contacto visibles al escanear |
| calendario | iCalendar | fechas UTC y fin posterior al inicio |
| geo | `geo:` | latitud y longitud validadas |

Las opciones se definen en `packages/contracts/src/qr-options.schema.ts`: formato SVG por defecto, ECC medio, 1024 px, margen de 4 módulos y negro sobre blanco.
