# 01 — Visión y alcance

## Visión

Ofrecer una herramienta sencilla para crear un QR estático fiable. La web ayuda a ingresar datos; el servidor hace la validación y el trabajo de generación. La generación se ejecuta dentro del proyecto y no depende de un proveedor QR remoto.

## Usuario principal

Una persona que necesita convertir texto, una dirección, datos de contacto, una red WiFi, un evento o una ubicación en un archivo QR que pueda descargar y escanear.

## Flujo principal

```text
Elegir tipo -> ingresar contenido -> ajustar opciones -> validar y previsualizar -> descargar
```

## Incluido

- Texto, URL HTTP/HTTPS, correo, teléfono, SMS, WiFi, vCard, evento de calendario y ubicación.
- Corrección de errores, tamaño, margen y colores contrastados.
- Vista previa SVG y descargas SVG, PNG o GIF.
- Mensajes de validación y densidad antes de exportar.
- API sin estado y web sin autenticación.

## Excluido

- QR dinámicos o editables, short links y redirecciones.
- Analítica, cuentas, historial y administración.
- Subida o alojamiento de archivos y logos.
- Servicios QR externos, microservicios, base de datos, Redis y colas.

## Principios

1. El QR estático contiene directamente los datos elegidos.
2. La API es la fuente de verdad para validar y renderizar.
3. El contenido de una petición no se guarda.
4. La escaneabilidad tiene prioridad sobre decoración.
5. Toda dependencia de ejecución se justifica y queda documentada.
