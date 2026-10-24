# Alcance actual — acore-qr

## Objetivo

Crear QR estáticos desde una interfaz pequeña. La API valida el contenido y realiza toda la codificación y el renderizado.

## Incluido

- Texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario y ubicación.
- Opciones de ECC, tamaño, margen y colores.
- Vista previa SVG y exportación SVG, PNG y GIF.
- Validación de capacidad, contraste y URL.
- Sin registro, base de datos, almacenamiento ni servicio QR externo.

## Fuera de alcance

Archivos, logos, QR dinámicos, short links, cuentas, historial, analítica y paneles de administración.

## Criterios

- La API es el único componente que genera el QR.
- La interfaz puede mostrar errores locales del formulario, pero la API valida antes de renderizar.
- La vista previa y la descarga llaman al mismo servicio y comparten opciones.
- El contenido no se persiste.
