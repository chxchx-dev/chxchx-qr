# Checklist de publicación

## Producto

- [ ] El alcance publicado coincide con ADR-009.
- [ ] La interfaz aclara que los códigos son estáticos.
- [ ] Los nueve tipos de contenido y los formatos expuestos corresponden al contrato.

## Código y archivos

- [ ] Formato, lint, typecheck, pruebas y build pasan en CI.
- [ ] `package-lock.json` corresponde a los manifests.
- [ ] La web estática apunta a la URL pública del API.
- [ ] El runtime Node soporta las dependencias y `sharp`.

## Seguridad y privacidad

- [ ] CORS restringido al origen publicado.
- [ ] No se registran cuerpos de petición.
- [ ] Rate limits ajustados al despliegue.
- [ ] Auditoría de dependencias y escaneo de secretos pasan.

## Operación

- [ ] `/health/live` y `/health/ready` responden.
- [ ] HTTPS está habilitado.
- [ ] Hay una versión previa disponible para rollback.
