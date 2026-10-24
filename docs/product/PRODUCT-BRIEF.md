# Brief del producto — acore-qr

## Problema

Una persona necesita convertir un dato en un QR sin registrarse ni recurrir a una herramienta de escritorio. El resultado debe contener exactamente ese dato y poder descargarse en un formato útil.

## Propuesta

Una interfaz simple para elegir tipo, ingresar contenido, revisar el QR y descargarlo. La API local del proyecto valida y genera la salida; no se llama a un proveedor QR remoto.

## Flujo

```text
Elegir tipo -> ingresar datos -> ajustar opciones si hace falta -> previsualizar -> descargar
```

## Tipos

Texto, URL, correo, teléfono, SMS, WiFi, vCard, evento de calendario y geo.

## Formatos

SVG para salida vectorial, PNG para imagen raster y GIF para compatibilidad simple.

## Qué significa estático

El contenido queda codificado en el QR. Después de descargarlo no se puede cambiar ni medir desde acore-qr. No se promete seguimiento ni redirección.

## Límites deliberados

No incluye alojamiento de archivos, logos, cuentas, QR dinámicos, historial, analítica ni panel administrativo. Las funciones deben reconsiderarse con una nueva decisión explícita de alcance.
