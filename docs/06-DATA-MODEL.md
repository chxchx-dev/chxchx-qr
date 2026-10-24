# 06 — Datos y persistencia

El generador no tiene base de datos ni almacenamiento de archivos.

Cada petición de validación o render contiene el contenido necesario y se procesa en memoria. La respuesta se devuelve al cliente y no se archiva. Los archivos descargables se crean para esa respuesta; la API no mantiene una biblioteca ni un historial.

Las contraseñas WiFi y demás valores sensibles deben excluirse de logs. La interfaz conserva el borrador mientras permanece abierta y no escribe contenido en `localStorage`.

Cualquier necesidad futura de historial, cuentas o QR dinámicos requiere redefinir el alcance, el modelo de datos, la política de privacidad y el despliegue antes de añadir persistencia.
