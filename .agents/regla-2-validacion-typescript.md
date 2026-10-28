# Regla 2: Validacion obligatoria en TypeScript

- Alcance de aplicacion: por patron de archivo.
- Patron: src/**/*.ts y packages/shared/**/*.ts

## Descripcion
Cualquier cambio en archivos TypeScript debe validar tipado y consistencia de contratos antes de proponerse como finalizado.

## Criterios de cumplimiento
- Ejecutar validacion de tipos relevante al cambio.
- Corregir errores introducidos por la modificacion.
- Verificar que no se rompan interfaces compartidas.
