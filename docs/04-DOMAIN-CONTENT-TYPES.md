# 04 — Dominio y Tipos de Contenido

## 1. Modelo de entrada

```ts
type QrContent =
  | TextContent
  | UrlContent
  | EmailContent
  | PhoneContent
  | SmsContent
  | WifiContent
  | VCardContent
  | CalendarContent
  | GeoContent
  | FileLinkContent
  | DynamicLinkContent;
```

Cada tipo produce un único `canonicalPayload: string`.

## 2. Texto

### Entrada

```ts
{
  type: "text",
  text: string
}
```

### Reglas

- conservar saltos de línea;
- normalizar a Unicode NFC;
- rechazar string vacío;
- límite de producto menor al máximo teórico;
- advertir cuando la densidad sea alta.

## 3. URL

### Entrada

```ts
{
  type: "url",
  url: string
}
```

### Reglas

- aceptar solo `https:` y `http:`;
- `https:` es recomendado;
- eliminar espacios alrededor;
- usar `URL` nativa para parsear;
- preservar query y fragment;
- no convertir silenciosamente dominios inválidos;
- no aceptar credenciales embebidas salvo decisión explícita;
- bloquear `javascript:`, `data:`, `file:`, `vbscript:`.

## 4. Correo

Payload:

```text
mailto:usuario@example.com?subject=...&body=...
```

Reglas:

- dirección obligatoria;
- asunto y cuerpo opcionales;
- usar `URLSearchParams`;
- no concatenar manualmente;
- validar longitud final.

## 5. Teléfono

Payload:

```text
tel:+573001234567
```

Reglas:

- limpiar espacios, guiones y paréntesis;
- conservar `+`;
- no inventar código de país;
- mostrar advertencia si no es formato internacional.

## 6. SMS

Payload:

```text
sms:+573001234567?body=Hola
```

La compatibilidad exacta varía entre sistemas. La UI debe indicar que el comportamiento depende del dispositivo.

## 7. WiFi

Formato:

```text
WIFI:T:WPA;S:MiRed;P:MiClave;H:false;;
```

Campos:

- `T`: `WPA`, `WEP` o `nopass`;
- `S`: SSID;
- `P`: contraseña;
- `H`: red oculta.

Escapar en `S` y `P`:

```text
\ ; , : "
```

Reglas:

- `nopass` no incluye contraseña;
- no registrar contraseña en logs;
- no guardar el formulario por defecto;
- limpiar el estado al cerrar o recargar si el usuario lo pide.

## 8. vCard

Versión inicial:

```text
BEGIN:VCARD
VERSION:3.0
N:Apellido;Nombre;;;
FN:Nombre Apellido
ORG:Empresa
TITLE:Cargo
TEL;TYPE=CELL:+573001234567
EMAIL:usuario@example.com
URL:https://example.com
ADR:;;Dirección;Ciudad;Región;Código;País
NOTE:Nota
END:VCARD
```

Reglas:

- `FN` obligatorio;
- saltos CRLF;
- escapar `\`, `,`, `;` y saltos;
- omitir líneas vacías;
- no incluir campos desconocidos;
- limitar notas.

## 9. Evento de calendario

Formato iCalendar:

```text
BEGIN:VEVENT
SUMMARY:Reunión
DTSTART:20260805T150000Z
DTEND:20260805T160000Z
LOCATION:...
DESCRIPTION:...
END:VEVENT
```

Reglas:

- fechas convertidas conscientemente;
- no asumir zona horaria;
- `DTEND` posterior a `DTSTART`;
- usar UTC o TZID válido;
- escapar texto iCalendar;
- documentar que algunos lectores requieren envoltura `VCALENDAR`.

La implementación final recomendada usa:

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QR Studio//EN
BEGIN:VEVENT
...
END:VEVENT
END:VCALENDAR
```

## 10. Ubicación

Payload:

```text
geo:10.9685,-74.7813
```

Opcional:

```text
geo:10.9685,-74.7813?q=Etiqueta
```

Reglas:

- latitud entre -90 y 90;
- longitud entre -180 y 180;
- precisión limitada;
- no inferir ubicación sin permiso.

## 11. Archivo

El payload nunca es el binario.

```text
https://files.example.com/f/{token}
```

Metadatos:

```ts
{
  type: "file-link",
  fileId: string,
  url: string,
  expiresAt?: string
}
```

## 12. Dinámico

```text
https://q.example.com/r/{slug}
```

El destino real existe en base de datos.

## 13. Opciones de QR

```ts
type QrRenderOptions = {
  format: "svg" | "gif" | "png";
  ecc: "low" | "medium" | "quartile" | "high";
  size: number;
  marginModules: number;
  foreground: string;
  background: string;
  logoId?: string;
};
```

## 14. Valores por defecto

```json
{
  "format": "svg",
  "ecc": "medium",
  "size": 1024,
  "marginModules": 4,
  "foreground": "#000000",
  "background": "#FFFFFF"
}
```

## 15. Reglas de capacidad

El motor debe calcular o capturar el fallo real del encoder.

Estados:

- `safe`: densidad normal;
- `dense`: escaneable, pero exige tamaño mayor;
- `critical`: bloquear personalización agresiva;
- `overflow`: rechazar y sugerir enlace.

No se promete una cifra fija para todos los casos porque depende de:

- versión;
- modo;
- ECC;
- caracteres;
- codificación.

## 16. Regla de contraste

Criterio de producto:

- foreground visualmente más oscuro que background;
- contraste objetivo mínimo 4.5:1 como regla conservadora de UI;
- bloquear combinaciones invertidas en MVP;
- permitir excepciones solo bajo modo avanzado y prueba de lectura.

## 17. Logo

- requiere ECC `high`;
- máximo inicial: 20% del ancho visible;
- área excavada;
- margen interno;
- imagen raster re-encodeada;
- nunca tapar patrones de posición;
- prueba de decodificación obligatoria.
