# 01 — Visión, Alcance y Producto

## 1. Visión

Crear una plataforma de generación de QR que sea:

- rápida para usos simples;
- segura para enlaces y archivos;
- consistente entre vista previa y descarga;
- personalizable sin destruir la escaneabilidad;
- preparada para evolucionar a QR dinámicos;
- desplegable con costos bajos;
- auditable por mantener pocas dependencias de runtime.

## 2. Usuarios objetivo

### Usuario anónimo

Necesita generar y descargar un QR estático sin crear cuenta.

### Usuario registrado

Necesita guardar, duplicar, editar, organizar y consultar sus QR.

### Negocio

Necesita QR dinámicos, cambiar destinos, revisar escaneos y exportar reportes.

### Administrador

Necesita controlar abuso, archivos, límites, usuarios, destinos bloqueados y estado operativo.

## 3. Trabajo principal del usuario

```text
Elegir tipo -> ingresar datos -> personalizar -> validar -> descargar o guardar
```

El flujo no debe obligar a comprender versiones QR, máscaras o codificaciones internas.

## 4. Alcance del MVP

Incluye:

- texto;
- URL HTTP/HTTPS;
- correo;
- teléfono;
- SMS;
- WiFi;
- vCard;
- evento de calendario;
- ubicación;
- selección de nivel ECC;
- colores seguros;
- margen mínimo;
- SVG;
- GIF;
- PNG cuando el adaptador de rasterizado esté habilitado;
- vista previa responsive;
- descarga;
- copiar payload;
- validación de escaneabilidad;
- API de renderizado;
- funcionamiento sin base de datos.

## 5. Alcance posterior

### Archivos

- carga segura;
- almacenamiento;
- URL de descarga;
- expiración;
- eliminación.

### QR dinámicos

- URL corta;
- destino editable;
- activación y pausa;
- fecha de expiración;
- analítica.

### Cuentas

- historial;
- etiquetas;
- duplicación;
- favoritos;
- organización por proyecto.

### Equipos

- espacios de trabajo;
- roles;
- límites;
- auditoría.

## 6. Fuera de alcance inicial

- pagos;
- marketplace de plantillas;
- IA generativa para alterar visualmente la matriz;
- QR artísticos que deformen módulos;
- ejecución de scripts;
- alojamiento de ejecutables;
- acortador público sin control;
- importación masiva;
- escáner de cámara;
- app móvil nativa;
- microservicios;
- Kubernetes;
- Redis;
- colas;
- almacenamiento permanente de IP completa.

## 7. Principios de producto

### Sin engaños

Un QR estático no se anuncia como editable ni rastreable.

### Sin descargas falsas

El usuario debe saber si el QR contiene el dato directo o una URL administrada por la plataforma.

### Escaneabilidad antes que estética

No se permite una personalización que haga el QR inestable.

### Privacidad por defecto

La analítica dinámica registra lo mínimo necesario.

### Exportación honesta

La resolución, formato y margen informados deben coincidir con el archivo generado.

## 8. Métricas de producto

### MVP

- porcentaje de generación exitosa;
- tiempo medio de vista previa;
- tiempo medio de exportación;
- errores de validación por tipo;
- tasa de QR que pasan pruebas de lectura;
- abandono del formulario.

### QR dinámicos

- redirecciones exitosas;
- latencia p95 de redirección;
- destinos bloqueados;
- escaneos únicos estimados;
- eventos descartados por bots.

## 9. Criterio de éxito técnico inicial

La primera versión es válida cuando un usuario puede generar un QR estático desde un móvil, descargarlo y escanearlo con al menos dos lectores distintos sin crear una cuenta.
