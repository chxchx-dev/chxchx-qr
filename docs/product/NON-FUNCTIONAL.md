# Requisitos no funcionales vigentes

## Rendimiento

- Validar sin crear una matriz o un archivo de salida innecesario.
- Debounce de vista previa en la web y aborto de solicitudes obsoletas.
- Cuota de PNG menor que la de SVG/GIF.
- Tamaño máximo de cuerpo y de exportación controlados por configuración y contrato.

## Seguridad

- La API valida todas las entradas.
- No hacer fetch de las URLs recibidas.
- CORS limitado al origen configurado.
- Errores con request ID; sin trazas en producción.
- Límites de rate por IP y formato.

## Privacidad

- Sin base de datos ni almacenamiento de solicitudes.
- No escribir cuerpo de solicitud en logs.
- No persistir contenido en el navegador.

## Calidad de lectura

- Contraste mínimo validado.
- Margen silencioso configurable.
- Capacidad comprobada por encoder antes de render.
- El PNG final se decodifica y compara contra el payload original.

## Accesibilidad

Teclado, foco visible, etiquetas y ayuda por campo, errores cercanos al campo, vista previa con texto accesible y notificaciones `aria-live`.
