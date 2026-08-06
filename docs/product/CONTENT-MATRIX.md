# CONTENT-MATRIX — Tipos de contenido del MVP (acore-qr)

Cada tipo produce un único `canonicalPayload: string`. Los límites de texto por defecto: **500 caracteres** para el tipo texto; para el resto, el payload final no debe superar la capacidad real del encoder (estado `overflow` = rechazar y sugerir enlace).

## 1. Matriz de tipos

| Tipo | Campos | Obligatorio/Opcional | Payload canónico | Ejemplo | Validación | Datos sensibles | Compatibilidad |
|---|---|---|---|---|---|---|---|
| `text` | `text` | obligatorio | el texto normalizado | `Hola mundo` | no vacío, ≤ 500, NFC, conserva saltos de línea | ninguno | todos los lectores |
| `url` | `url` | obligatorio | la URL normalizada | `https://example.com/path?a=1#f` | solo `https:`/`http:`, parseo con `URL`, sin credenciales embebidas, sin espacios laterales | credenciales en URL rechazadas | todos los lectores; recomendado `https:` |
| `email` | `email`, `subject?`, `body?` | email obligatorio; resto opcional | `mailto:a@b.com?subject=...&body=...` | `mailto:hola@acore.dev` | formato email, `URLSearchParams`, longitud final | contenido del cuerpo (no se registra) | la mayoría abre cliente de correo |
| `phone` | `phone` | obligatorio | `tel:+573001234567` | `tel:+34600123456` | limpiar espacios/guiones/paréntesis, conservar `+`, no inventar país | número (visible) | la mayoría abre marcador; advertir si no es internacional |
| `sms` | `phone`, `body?` | phone obligatorio | `sms:+573001234567?body=Hola` | `sms:+34600123456?body=Cita` | igual que phone; body opcional | número (visible) | varía por sistema; la UI lo indica |
| `wifi` | `ssid`, `password?`, `type` (`WPA`/`WEP`/`nopass`), `hidden?` | ssid y type obligatorios; password según type | `WIFI:T:WPA;S:MiRed;P:MiClave;H:false;;` | `WIFI:T:nopass;S:CafeLibre;H:false;;` | escapar `\ ; , : "` en S y P; `nopass` sin contraseña | **contraseña** — no en logs, no persistida, limpiar estado al cerrar | depende del SO (iOS/Android); la UI lo indica |
| `vcard` | `name` (FN), `lastname?`, `org?`, `title?`, `phone?`, `email?`, `url?`, `address?`, `note?` | FN obligatorio | `BEGIN:VCARD\nVERSION:3.0\n...` | vCard de contacto | CRLF, escapar `\ , ;` y saltos, omitir líneas vacías, limitar notas | datos personales (visible por naturaleza) | la mayoría de contactos; leer con VERSION:3.0 |
| `calendar` | `summary` (obligatorio), `start`, `end?`, `location?`, `description?` | summary y start obligatorios | `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//acore-qr//EN\nBEGIN:VEVENT\nSUMMARY:Reunión\nDTSTART:20260805T150000Z\nDTEND:20260805T160000Z\nLOCATION:...\nDESCRIPTION:...\nEND:VEVENT\nEND:VCALENDAR` | Reunión de 1 hora (2026-08-05 15:00–16:00 UTC) | `DTEND` posterior a `DTSTART`, UTC o TZID válido, escapar iCalendar | agenda personal (visible) | requiere envoltura VCALENDAR en varios lectores |
| `geo` | `lat`, `lng`, `label?` | lat/lng obligatorios | `geo:10.9685,-74.7813` u `?q=Etiqueta` | `geo:40.4168,-3.7038?q=Puerta del Sol` | lat ∈ [-90,90], lng ∈ [-180,180], precisión limitada | ubicación (visible) | abre mapa; nunca inferir ubicación sin permiso |

## 2. Reglas transversales

- **Normalización:** Unicode NFC antes de validar.
- **Capacidad:** el motor calcula o captura el fallo real del encoder. Estados: `safe`, `dense`, `critical`, `overflow` (rechazar y sugerir enlace).
- **Datos sensibles:** las contraseñas WiFi no se guardan ni se envían a analítica; el formulario no persiste el valor por defecto.
- **Escapado:** vCard, WiFi e iCalendar se escapan según su formato; no se concatena manualmente (mailto usa `URLSearchParams`).
- **Sin trucos:** no se convierte silenciosamente un dominio inválido; no se aceptan esquemas peligrosos.

## 3. Opciones de renderizado (compartidas)

```ts
type QrRenderOptions = {
  format: "svg" | "gif" | "png";
  ecc: "low" | "medium" | "quartile" | "high";
  size: number;
  marginModules: number;
  foreground: string;
  background: string;
  logoId?: string; // Fase 04
};
```

Valores por defecto: `format: "svg"`, `ecc: "medium"`, `size: 1024`, `marginModules: 4`, `foreground: "#000000"`, `background: "#FFFFFF"`.

## 4. Verificación de la matriz (checklist de la fase)

- [ ] cada tipo tiene campos y payload;
- [ ] cada tipo tiene ejemplo y validación;
- [ ] cada campo sensible está identificado;
- [ ] cada tipo indica compatibilidad y advertencias UI;
- [ ] el tipo `text` respeta el límite de 500 caracteres;
- [ ] la matriz es la fuente para los builders de `qr-core` (Fase 02).
