# Flujo de usuario

## Crear un QR estático

1. Elegir uno de los nueve tipos de contenido.
2. Completar los campos necesarios.
3. Ajustar ECC, tamaño, margen o colores si lo necesita.
4. La web envía la entrada a la API para validarla y solicita el SVG de vista previa.
5. Elegir SVG, PNG o GIF y descargar el archivo generado por la API.

## Errores

- Los errores de estructura aparecen junto al campo correspondiente.
- Un contenido que excede capacidad o contraste se bloquea con una explicación del servidor.
- Si el API no responde, se conservan los campos para poder volver a intentar.

## Privacidad visible

El QR es estático; acore-qr no puede editarlo ni contabilizar escaneos después de descargarlo. El contenido no se almacena.
