# USER-FLOWS — Flujos principales del MVP (acore-qr)

## 1. Mapa de pantallas (MVP)

| Pantalla | Pública | Acceso |
|---|---|---|
| Generador (flujo principal) | sí | anónimo |
| Resultado / descarga | sí | anónimo |
| Cómo funciona | sí | anónimo |
| Privacidad | sí | anónimo |
| Reportar abuso | sí | anónimo |

> Login, registro, dashboard, archivos y analítica son fases posteriores (07 y 08).

## 2. Flujo principal: generar QR estático

```text
Elegir tipo -> ingresar datos -> personalizar -> validar -> descargar / copiar
```

### Paso 1 — Elegir contenido

- Selector de tipo accesible (texto, URL, correo, teléfono, SMS, WiFi, vCard, calendario, ubicación).
- Cada opción muestra un ejemplo específico del dato requerido.

### Paso 2 — Ingresar datos

- Campos con `label`; ayuda no dependiente de placeholder.
- Contador de longitud (límite 500 en texto).
- Validación en vivo sin bloquear el formulario completo.
- WiFi: botón mostrar/ocultar contraseña y aviso "no se guarda".

### Paso 3 — Personalizar

- Selector ECC con explicación.
- Input de color + valor hexadecimal (foreground/background).
- Selector de tamaño y margen.
- Botón restaurar valores por defecto.
- Regla: contraste mínimo 4.5:1; combinaciones invertidas bloqueadas en MVP.

### Paso 4 — Validar

- Vista previa inmediata (generación local).
- Estados: `validando`, `válido`, `advertencia`, `inválido`, `error de servidor`.
- Muestra densidad (`safe`/`dense`), advertencias y recomendación de tamaño.
- Estado "validado" visible antes de exportar.

### Paso 5 — Descargar o copiar

- Elegir formato (SVG, GIF, PNG), nombre de archivo y descargar.
- Copiar payload canónico.
- La descarga proviene de la API (mismo motor que la vista previa).
- Descarga anunciada (accesible, `aria-live`).

## 3. Flujo: error y recuperación

1. El usuario ingresa un dato inválido (p. ej., URL sin `https://`).
2. Mensaje claro junto al campo: *"Usa una dirección completa que empiece por https:// o http://."*
3. La exportación queda bloqueada hasta corregir.
4. En error de servidor, el formulario conserva los datos (excepto secretos como contraseñas WiFi).

## 4. Flujo: contenido demasiado grande

1. El contenido supera la capacidad del encoder (estado `overflow`).
2. Se rechaza la exportación con mensaje: *"El contenido es demasiado grande para un QR fiable. Reduce el texto o usa un enlace."*
3. No se genera un QR ilegible silenciosamente.

## 5. Flujo: tipos especiales (reglas UX)

- **WiFi:** aviso de que el comportamiento depende del dispositivo; contraseña no persistida; campo de tipo password con toggle.
- **SMS:** aviso de que la compatibilidad exacta varía entre sistemas.
- **Calendario:** fechas con selector; validación `DTEND > DTSTART`.
- **URL:** solo http/https; `https:` recomendado; aviso si se detecta credencial embebida.

## 6. Estados de pantalla

| Estado | Comportamiento |
|---|---|
| Inicial | Explica qué dato se necesita |
| Validando | No bloquea todo el formulario; debounce corto |
| Válido | Confirmación discreta |
| Advertencia | Permite continuar si es seguro (p. ej., densidad `dense`) |
| Inválido | Bloquea exportación y explica la corrección |
| Error de servidor | Mantiene datos del formulario, excepto secretos |

## 7. Verificación de flujos (checklist de la fase)

- [ ] el flujo principal se completa sin cuenta;
- [ ] cada pantalla del mapa responde a al menos un flujo;
- [ ] cada estado tiene comportamiento definido;
- [ ] los flujos de error no pierden datos del usuario;
- [ ] la honestidad estático/dinámico está presente en la UI;
- [ ] el flujo es completable con una mano y sin zoom en móvil.
