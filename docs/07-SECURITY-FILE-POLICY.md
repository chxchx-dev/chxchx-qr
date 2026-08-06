# 07 — Seguridad y Política de Archivos

## 1. Modelo de amenazas

Actores:

- usuario legítimo que comete errores;
- bot que abusa generación o subida;
- atacante que sube contenido malicioso;
- atacante que crea enlaces de phishing;
- atacante que busca agotar memoria/CPU;
- usuario que intenta acceder a recursos ajenos;
- dependencia comprometida.

Activos:

- disponibilidad;
- archivos;
- destinos;
- sesiones;
- analítica;
- reputación del dominio;
- secretos;
- base de datos.

## 2. Reglas de entrada

Toda entrada se valida en servidor por:

- tipo;
- longitud;
- formato;
- esquema;
- caracteres;
- relación entre campos;
- capacidad QR;
- autorización;
- límite de frecuencia.

## 3. Destinos URL

Permitido:

```text
https:
http:
```

Bloqueado:

```text
javascript:
data:
file:
ftp:
vbscript:
blob:
```

Políticas adicionales:

- no aceptar username/password embebidos;
- normalizar hostname;
- aplicar lista de dominios bloqueados;
- marcar Punycode en UI;
- advertir sobre dominios recién creados si existe servicio futuro;
- no hacer fetch del destino desde la API de redirección.

## 4. Phishing y abuso

Un acortador dinámico puede convertirse en infraestructura de phishing.

Controles mínimos:

- cuentas verificadas para volumen alto;
- rate limits;
- reportar QR;
- bloqueo administrativo;
- página intermedia para destinos sospechosos;
- auditoría;
- límite por usuario;
- términos de uso;
- contacto de abuso;
- denylist de dominios.

## 5. Política de archivos

### Tipos iniciales permitidos

```text
image/png
image/jpeg
image/webp
application/pdf
text/plain
```

`text/plain` puede deshabilitarse en producción si se usa para distribuir código.

### Tipos bloqueados

- ejecutables;
- instaladores;
- DLL;
- scripts;
- archivos Office con macros;
- APK;
- paquetes;
- archivos comprimidos;
- HTML;
- SVG;
- binarios desconocidos.

Extensiones bloqueadas, entre otras:

```text
.exe .msi .bat .cmd .ps1 .sh .js .mjs .cjs .vbs
.scr .com .dll .jar .apk .html .htm .svg .zip .rar .7z
.docm .xlsm .pptm
```

No confiar únicamente en extensión.

## 6. Validación de archivos

Secuencia:

1. límite HTTP;
2. límite Multer;
3. nombre aleatorio;
4. firma mágica;
5. MIME permitido;
6. extensión coherente;
7. hash SHA-256;
8. re-encode de imágenes;
9. escaneo antimalware si está disponible;
10. almacenamiento;
11. estado `clean`;
12. generación de URL.

Si falla cualquier paso:

- no publicar URL;
- eliminar temporal;
- registrar evento sin contenido sensible;
- responder error controlado.

## 7. Multer

Requisitos:

- versión 2 o superior;
- `limits.fileSize`;
- `limits.files = 1`;
- `limits.fields` bajo;
- almacenamiento temporal aislado;
- no usar `memoryStorage` para archivos medianos;
- handler de errores;
- cleanup con `finally`.

## 8. Nombre y ruta

Nunca:

```ts
path.join(uploadDir, file.originalname)
```

Usar:

```text
storage_key = random/opaque identifier
original_name = metadata sanitized
```

## 9. Descarga

Headers:

```text
Content-Type: validated-type
Content-Disposition: attachment; filename="safe-name.ext"
X-Content-Type-Options: nosniff
Content-Security-Policy: sandbox
Cache-Control: private, max-age=...
```

Para imágenes que se muestran inline, deben haber sido re-encodeadas.

## 10. Logos

Permitidos:

- PNG;
- JPEG;
- WebP.

Proceso:

- límite pequeño;
- decodificar;
- eliminar metadata;
- re-encode;
- redimensionar;
- convertir a PNG interno;
- no aceptar SVG;
- no conservar original si no es necesario.

## 11. Rate limiting

Rutas separadas:

| Ruta | Límite inicial |
|---|---|
| validar | alto |
| render SVG | medio |
| render PNG | bajo |
| upload | muy bajo |
| login | estricto |
| redirect | alto y optimizado |
| admin | estricto |

Los números exactos se configuran por ambiente.

## 12. Autenticación

Recomendación:

- sesión opaca;
- cookie HttpOnly;
- token aleatorio 256 bits;
- hash guardado;
- expiración;
- rotación al iniciar sesión;
- revocación al cerrar;
- límite de sesiones;
- Origin check.

Contraseñas:

- scrypt de Node;
- salt aleatorio;
- parámetros versionados;
- longitud mínima;
- no truncar silenciosamente;
- no registrar.

## 13. CSRF

Para arquitectura same-origin:

- `SameSite=Lax`;
- comprobar `Origin` en métodos mutables;
- token CSRF si se habilitan escenarios cross-site;
- CORS no sustituye CSRF.

## 14. XSS

- React escapa texto por defecto;
- evitar `dangerouslySetInnerHTML`;
- sanitizar SVG generado;
- no insertar destino como HTML;
- CSP estricta;
- no servir HTML subido.

## 15. Headers

Mínimos:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Cross-Origin-Resource-Policy
```

## 16. Logs

Nunca registrar:

- contraseña WiFi;
- contraseñas de cuenta;
- cookie;
- token;
- payload completo sensible;
- contenido de archivo;
- IP completa persistente.

## 17. Dependencias

CI debe ejecutar:

```bash
npm audit --omit=dev
```

Además:

- revisar alertas;
- actualizar parches;
- bloquear versiones vulnerables;
- generar SBOM en release;
- pin de imagen Docker por digest cuando aplique.

## 18. Respuesta a incidentes

Debe existir:

```text
docs/security/INCIDENT-RESPONSE.md
```

Incluye:

- detección;
- contención;
- revocación;
- comunicación;
- recuperación;
- postmortem;
- acciones preventivas.
