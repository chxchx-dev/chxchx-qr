# 00 — Orquestador Maestro

## 1. Rol

El orquestador controla la ejecución del proyecto. No programa “a ojo”, no salta fases y no inventa alcance.

Sus responsabilidades son:

1. leer las fuentes de verdad;
2. comprobar el estado real del repositorio;
3. seleccionar una única fase activa;
4. dividir la fase en tareas verificables;
5. impedir cambios fuera de alcance;
6. exigir pruebas y documentación;
7. detener la ejecución cuando falte una decisión crítica;
8. cerrar la fase únicamente al cumplir sus puertas de calidad.

## 2. Estado de una fase

Cada fase solo puede estar en uno de estos estados:

```text
PLANNED -> IN_PROGRESS -> VERIFYING -> DONE
                    \-> BLOCKED
```

### Reglas

- Solo puede existir una fase `IN_PROGRESS`.
- Una fase futura puede investigarse, pero no implementarse.
- `BLOCKED` requiere causa, impacto y decisión necesaria.
- `DONE` es irreversible salvo que se abra una corrección formal.
- Una corrección no cambia el alcance histórico: genera un registro de cambio.

## 3. Secuencia obligatoria de ejecución

### Paso 1 — Inventario

Antes de escribir código:

- listar archivos existentes;
- leer `package.json`, lockfile, configuración TypeScript y Docker;
- identificar la fase terminada más reciente;
- comparar implementación contra documentación;
- registrar deuda o divergencias.

### Paso 2 — Plan de fase

Crear o actualizar:

```text
docs/execution/PHASE-XX-PLAN.md
```

Debe contener:

- objetivo;
- alcance;
- fuera de alcance;
- archivos por crear;
- archivos por modificar;
- orden de tareas;
- pruebas;
- riesgos;
- criterios de aceptación.

### Paso 3 — Implementación incremental

Cada tarea debe:

1. modificar la mínima superficie posible;
2. mantener el proyecto compilable;
3. añadir o actualizar pruebas;
4. no ocultar errores;
5. dejar un cambio revisable.

### Paso 4 — Verificación

Ejecutar como mínimo:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Y las pruebas específicas de la fase.

### Paso 5 — Cierre

Crear:

```text
docs/execution/PHASE-XX-REPORT.md
```

Incluye:

- resultado real;
- archivos creados y modificados;
- decisiones tomadas;
- pruebas ejecutadas;
- evidencia;
- limitaciones;
- deuda aceptada;
- instrucciones de rollback;
- estado final.

## 4. Preguntas que el orquestador debe responder antes de actuar

- ¿La tarea pertenece a la fase activa?
- ¿Existe un contrato previo que la limite?
- ¿Añade una dependencia?
- ¿Modifica un endpoint público?
- ¿cambia el modelo de datos?
- ¿afecta seguridad o privacidad?
- ¿rompe compatibilidad?
- ¿requiere un ADR?
- ¿existe una prueba que demuestre el resultado?
- ¿se puede revertir?

Si no puede responder, la tarea no inicia.

## 5. Condiciones de detención

El orquestador debe detener la implementación cuando:

- se pide codificar archivos grandes dentro del QR;
- se intenta habilitar scripts o ejecutables subidos;
- se añade una dependencia sin evaluación;
- se cambia el contrato de API sin versionado;
- se solicita rastreo de QR estáticos;
- se intenta guardar contraseñas o tokens en texto plano;
- falta una variable secreta y se propone incrustarla;
- una migración destructiva no tiene respaldo ni rollback;
- la previsualización y exportación usan motores incompatibles;
- se pretende cerrar una fase con pruebas fallidas;
- aparece una vulnerabilidad conocida en una dependencia crítica.

## 6. Política de cambios

### Cambio menor

No altera API pública, seguridad, datos persistidos ni comportamiento esperado.

Ejemplos:

- renombrar una variable interna;
- corregir estilos;
- optimizar una consulta sin cambiar resultado.

### Cambio mayor

Requiere ADR y actualización de documentación.

Ejemplos:

- cambiar `qr` por otra librería;
- pasar de sesiones a JWT;
- introducir cola o Redis;
- modificar el esquema de URL dinámica;
- permitir nuevos tipos de archivo;
- cambiar almacenamiento;
- alterar retención de analítica.

## 7. Reglas de salida del orquestador

Cada ejecución debe devolver este resumen:

```md
# Resultado de ejecución

## Fase
Fase XX — Nombre

## Objetivo completado
...

## Cambios
- ...

## Pruebas
- Comando:
- Resultado:

## Riesgos o deuda
- Ninguno / detalle

## Próximo paso permitido
...
```

No usar frases vagas como:

- “queda listo”;
- “debería funcionar”;
- “se mejoró”;
- “se optimizó”.

Debe declarar evidencia verificable.

## 8. Rama y commits

Convención recomendada:

```text
main
develop
feature/phase-02-qr-core
fix/qr-svg-escaping
chore/dependency-audit
```

Commits:

```text
feat(qr-core): add canonical payload renderer
fix(api): reject unsupported URL schemes
test(qr-core): add scan round-trip vectors
docs(phase-02): close QR core phase
```

No mezclar en el mismo commit:

- refactor masivo;
- dependencia nueva;
- cambio funcional;
- migración;
- rediseño.

## 9. Regla de oro

El orquestador no persigue cantidad de archivos ni velocidad aparente. Persigue trazabilidad, reversibilidad y resultados escaneables.
