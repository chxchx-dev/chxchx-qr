# Checklist — Definition of Done

## Alcance

- [ ] La tarea pertenece a la fase.
- [ ] No se adelantó funcionalidad.
- [ ] Los criterios de aceptación están cubiertos.
- [ ] No quedan supuestos ocultos.

## Código

- [ ] TypeScript estricto.
- [ ] Sin `any` injustificado.
- [ ] Sin código muerto.
- [ ] Sin `TODO` críticos.
- [ ] Responsabilidades separadas.
- [ ] Errores tipados.
- [ ] Imports correctos.
- [ ] Sin duplicación de contratos.

## Seguridad

- [ ] Entrada validada en servidor.
- [ ] Autorización comprobada.
- [ ] No hay secretos.
- [ ] Logs revisados.
- [ ] Límites definidos.
- [ ] Headers correctos.
- [ ] Temporales limpiados.
- [ ] Tipos de archivo revisados.
- [ ] URL schemes revisados.
- [ ] Dependencias auditadas.

## QR

- [ ] Payload canónico.
- [ ] Margen correcto.
- [ ] ECC correcto.
- [ ] Contraste válido.
- [ ] Exportación decodifica.
- [ ] Preview y final son compatibles.
- [ ] Overflow controlado.

## API

- [ ] Contrato compartido.
- [ ] HTTP correcto.
- [ ] Problem Details.
- [ ] Request ID.
- [ ] Content-Type.
- [ ] Cache policy.
- [ ] OpenAPI/docs actualizadas.

## Datos

- [ ] Migración versionada.
- [ ] Query parametrizada.
- [ ] Índices justificados.
- [ ] Retención.
- [ ] Rollback.
- [ ] Backup si aplica.

## Web

- [ ] Mobile-first.
- [ ] Teclado.
- [ ] Focus.
- [ ] Labels.
- [ ] Error accesible.
- [ ] Loading/error/empty.
- [ ] No token en localStorage.
- [ ] No secreto persistido.

## Pruebas

- [ ] Unitarias.
- [ ] Integración.
- [ ] E2E.
- [ ] Regresión por bug.
- [ ] Round-trip.
- [ ] Casos límite.
- [ ] Tests no flaky.

## Gates

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] E2E aplicable
- [ ] Audit aplicable

## Operación

- [ ] Config documentada.
- [ ] Health actualizado.
- [ ] Métricas.
- [ ] Logs.
- [ ] Alertas si aplica.
- [ ] Rollback.

## Documentación

- [ ] Fase actualizada.
- [ ] README.
- [ ] ADR si aplica.
- [ ] Changelog.
- [ ] Reporte de cierre.
