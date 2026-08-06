# 08 — UX, Diseño y Accesibilidad

## 1. Enfoque

Mobile-first real.

La pantalla principal debe permitir completar el flujo con una mano y sin zoom.

## 2. Estructura de pantalla

```text
Header
Selector de tipo
Formulario de contenido
Panel de personalización
Vista previa
Estado de validación
Acciones
Información de seguridad
Footer
```

En desktop:

```text
izquierda: formulario
derecha: vista previa sticky
```

En móvil:

```text
formulario -> vista previa -> acciones
```

## 3. Pantallas

### Públicas

- Generador.
- Resultado/descarga.
- Cómo funciona.
- Privacidad.
- Reportar abuso.
- Login y registro.
- Estado de archivo.

### Usuario

- Dashboard.
- Mis QR.
- Crear dinámico.
- Detalle.
- Editar destino.
- Analítica.
- Archivos.
- Perfil y sesiones.

### Administración

- Usuarios.
- QR bloqueados.
- Reportes.
- Archivos.
- Límites.
- Salud del sistema.

## 4. Flujo del generador

### Paso 1

Elegir contenido.

### Paso 2

Ingresar datos con ejemplos específicos.

### Paso 3

Personalizar con controles seguros.

### Paso 4

Mostrar:

- vista previa;
- densidad;
- advertencias;
- recomendación de tamaño;
- estado “validado”.

### Paso 5

Descargar o guardar.

## 5. Controles

- selector de tipo accesible;
- campos con label;
- ayuda no dependiente de placeholder;
- contador de longitud;
- selector ECC con explicación;
- input de color más valor hexadecimal;
- botón restaurar;
- uploader con área y botón;
- zoom de vista previa;
- nombre de archivo.

## 6. Estados

### Inicial

Explica qué dato se necesita.

### Validando

No bloquea todo el formulario.

### Válido

Muestra confirmación discreta.

### Advertencia

Permite continuar si es seguro.

### Inválido

Bloquea exportación y explica la corrección.

### Error de servidor

Mantiene datos del formulario, excepto secretos.

## 7. Accesibilidad

Objetivo: WCAG 2.2 AA.

Requisitos:

- navegación completa por teclado;
- focus visible;
- orden lógico;
- target táctil mínimo;
- contraste;
- `aria-live` para validación;
- textos alternativos;
- no depender del color;
- respetar `prefers-reduced-motion`;
- QR acompañado por descripción;
- descarga anunciada.

## 8. Privacidad UX

WiFi:

- botón mostrar/ocultar contraseña;
- mensaje “no se guarda”;
- no autocompletar salvo decisión.

Archivos:

- mostrar expiración;
- mostrar si será público por enlace;
- permitir eliminar;
- no afirmar “privado” si cualquiera con URL accede.

Dinámicos:

- explicar que la plataforma ve los escaneos;
- permitir desactivar analítica;
- mostrar retención.

## 9. Reglas visuales del QR

El área del QR:

- fondo neutro;
- espacio alrededor;
- no superponer botones;
- no aplicar sombras al archivo exportado;
- la UI puede tener tarjeta, el QR exportado no.

## 10. Diseño

Tokens mínimos:

```text
--color-bg
--color-surface
--color-text
--color-muted
--color-primary
--color-danger
--radius-sm
--radius-md
--space-*
```

Tailwind debe mapearse a tokens, no convertirse en clases arbitrarias sin sistema.

## 11. Rendimiento percibido

- debounce corto para entradas grandes;
- generación local inmediata;
- cancelar request anterior;
- skeleton solo cuando aporta;
- evitar spinners infinitos;
- mostrar progreso real en upload;
- no regenerar PNG en cada tecla.

## 12. Mensajes

Malo:

```text
Error 422
```

Bueno:

```text
El contenido es demasiado grande para un QR fiable. Sube el archivo y genera un enlace.
```

Malo:

```text
Invalid URL
```

Bueno:

```text
Usa una dirección completa que empiece por https:// o http://.
```
