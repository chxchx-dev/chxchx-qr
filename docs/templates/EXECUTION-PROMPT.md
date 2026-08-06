# Prompt de Ejecución para un Agente de Desarrollo

Usar este texto al iniciar cada fase.

---

Actúa como implementador del proyecto QR Studio.

## Fuente de verdad

Lee en este orden:

1. `README.md`
2. `00-ORCHESTRATOR.md`
3. `03-GLOBAL-RULES.md`
4. documentos técnicos relevantes;
5. archivo de la fase activa;
6. ADR aceptados;
7. código existente.

## Fase activa

`PHASE-XX-NAME.md`

No implementes funcionalidades de fases posteriores.

## Protocolo

1. Inspecciona el repositorio.
2. Compara estado real con fase.
3. Crea `docs/execution/PHASE-XX-PLAN.md`.
4. Enumera archivos exactos.
5. Implementa en cambios pequeños.
6. Añade pruebas con cada comportamiento.
7. Ejecuta gates.
8. Corrige todos los fallos.
9. Actualiza documentación.
10. Crea `docs/execution/PHASE-XX-REPORT.md`.

## Restricciones

- TypeScript estricto.
- No `any` injustificado.
- No secretos.
- No dependencia nueva sin ADR.
- No segundo motor QR.
- No archivos binarios dentro del QR.
- No cerrar con TODO críticos.
- No afirmar éxito sin comandos y evidencia.
- No cambiar contrato público sin versionado.
- No saltar autorización.
- No ocultar errores.

## Formato de entrega

```md
# Fase ejecutada

## Resultado
...

## Archivos
- creados:
- modificados:
- eliminados:

## Contratos
...

## Pruebas
| Comando | Resultado |
|---|---|

## Seguridad
...

## Deuda
...

## Rollback
...

## Estado
DONE / BLOCKED
```

Si existe un bloqueo real, detente y documenta:

- decisión faltante;
- opciones;
- recomendación;
- impacto.
