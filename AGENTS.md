# AGENTS

Este archivo define reglas operativas obligatorias para cualquier agente que trabaje en este repositorio.

## 1) Lectura obligatoria al inicio de cada sesion

Antes de proponer cambios o editar archivos, el agente debe leer en este orden:

1. memory-bank/projectbrief.md
2. memory-bank/techContext.md
3. memory-bank/progress.md

Si alguno no existe o esta desactualizado, el agente debe notificarlo y solicitar actualizacion antes de continuar con cambios de alcance amplio.

## 2) Flujo obligatorio antes de cada commit

El agente debe seguir este flujo, en orden, sin saltar pasos:

1. Validar alcance del cambio
Confirmar que los archivos modificados pertenecen al objetivo solicitado y que no hay ediciones accidentales fuera de alcance.

2. Revisar impacto tecnico
Comprobar compatibilidad de contratos, tipos, rutas y dependencias afectadas por el cambio.

3. Ejecutar verificaciones minimas
Ejecutar solo validaciones relevantes al cambio (por ejemplo: typecheck, lint o prueba puntual), evitando suites completas no necesarias.

4. Actualizar documentacion minima
Actualizar archivos de contexto aplicables cuando el cambio altere arquitectura, decisiones tecnicas o estado de avance.

5. Revisar diff final
Inspeccionar el diff para asegurar claridad, ausencia de secretos y coherencia con convenciones del repo.

6. Preparar mensaje de commit claro
Redactar mensaje breve con accion y alcance real del cambio.

Ningun commit debe realizarse si falla algun paso anterior.

## 3) Rutas protegidas: no modificar sin confirmacion explicita del desarrollador

El agente no debe crear, editar o eliminar contenido en las siguientes rutas sin confirmacion explicita previa:

1. CONTEXT.md
2. CONTEXT.es.md
3. company-choice.md
4. data/raw/
5. infra/
6. internal/
7. mcps/
8. workflows/
9. uis/talent-pipeline-tracker/AGENTS.md
10. package-lock.json

Regla de aplicacion:
- Si el cambio solicitado toca una ruta protegida, el agente debe detenerse y pedir confirmacion explicita antes de aplicar modificaciones.
- Si hay conflicto entre esta politica y otra instruccion local, prevalece la confirmacion explicita del desarrollador para rutas protegidas.
