# Referencias Técnicas Verificadas

> Revisadas al preparar esta documentación. Antes de implementar, comprobar versiones estables y avisos de seguridad.

## QR de Paul Miller

Repositorio:

```text
https://github.com/paulmillr/qr
```

Instalación npm:

```text
npm install qr
```

Puntos usados:

- encoder y decoder;
- cero dependencias propias;
- SVG, GIF y matriz raw;
- opciones ECC;
- DOM helper para PNG en navegador;
- advertencias de seguridad y fingerprinting.

## Capacidad QR — DENSO WAVE

```text
https://www.qrcode.com/en/about/version.html
https://www.qrcode.com/en/faq.html
```

Punto clave:

- la capacidad depende de versión, modo y ECC;
- el máximo binario práctico se encuentra alrededor de 3 KB o menos;
- no es un contenedor para archivos grandes.

## qrcode.react

```text
https://github.com/zpao/qrcode.react
```

Se revisó, pero no se seleccionó como baseline porque introduciría un segundo encoder. Puede reconsiderarse mediante ADR.

## Express

```text
https://expressjs.com/
https://expressjs.com/en/guide/migrating-5.html
```

Usar Express 5.

## Multer

```text
https://expressjs.com/en/resources/middleware/multer.html
https://expressjs.com/en/blog/2025/05/19/security-releases.html
```

Usar versión 2 o superior y mantenerse en la versión parcheada estable.

## React

```text
https://react.dev/
```

## Vite

```text
https://vite.dev/guide/
```

## Tailwind CSS con Vite

```text
https://tailwindcss.com/docs/installation/using-vite
```

La integración actual usa `tailwindcss` y `@tailwindcss/vite`.

## Node.js

```text
https://nodejs.org/en/about/previous-releases
```

Usar una línea LTS activa; esta arquitectura parte de Node.js 24 LTS.

## PostgreSQL

```text
https://www.postgresql.org/docs/
```

## OWASP

```text
https://owasp.org/www-project-top-ten/
https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
```

## RFC Problem Details

```text
https://www.rfc-editor.org/rfc/rfc9457
```

## vCard e iCalendar

```text
https://www.rfc-editor.org/rfc/rfc6350
https://www.rfc-editor.org/rfc/rfc5545
```

Aunque el MVP puede exportar vCard 3.0 por compatibilidad, el escaping y las decisiones deben documentarse.
