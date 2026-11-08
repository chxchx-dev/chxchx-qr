# Historial de HANDOFF

Secciones archivadas automáticamente, de la más reciente a la más antigua.

## 2026-11-08 — Handoff de revisión

1. Corregir el identificador del rate limit: derivarlo de la IP resuelta por Express con proxy confiable configurado; limitar o purgar buckets caducados para evitar crecimiento indefinido del `Map`.
2. Añadir `npm run test:e2e` al flujo de CI y resolver el entorno de Playwright.
3. Si el producto se publicará, elegir plataforma y cerrar configuración de API/web, HTTPS, health checks y rollback; después completar la checklist de publicación.
4. Ejecutar format, lint, typecheck, pruebas, build y E2E tras los cambios.

La revisión fue estática; no se modificó código de producto ni se ejecutaron verificaciones.
