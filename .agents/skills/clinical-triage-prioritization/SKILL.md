# Skill: Clinical Triage Prioritization

## Objetivo unico
Clasificar pacientes en una prioridad clinica operativa (critica, alta, media o baja) para ordenar atencion y agenda medica.

## Cuando usar esta skill
Usar en tareas recurrentes de preconsulta, ingreso de cita o revision de bandeja clinica cuando se necesite ordenar pacientes por urgencia y riesgo.

## Inputs documentados
1. region
- Tipo: string.
- Ejemplo: CO, MX, ES.
- Uso: aplicar reglas locales de atencion.

2. patient_id
- Tipo: string.
- Ejemplo: HC-000245.
- Uso: trazabilidad de la evaluacion.

3. edad
- Tipo: integer.
- Rango esperado: 0-120.

4. sintomas_principales
- Tipo: array de strings.
- Minimo: 1 sintoma.
- Ejemplo: dolor toracico, fiebre alta, disnea.

5. signos_alerta
- Tipo: array de strings.
- Ejemplo: saturacion_baja, confusion, sangrado_activo.

6. comorbilidades
- Tipo: array de strings.
- Ejemplo: diabetes, hipertension, EPOC.

7. riesgo_previo
- Tipo: string.
- Valores permitidos: alto, medio, bajo, desconocido.

8. fecha_hora_evaluacion
- Tipo: ISO-8601 string.
- Ejemplo: 2026-10-28T16:20:00Z.

## Output esperado
- prioridad_clinica: critica | alta | media | baja.
- score_riesgo: numero de 0 a 100.
- razones: lista breve de factores que justifican la prioridad.
- accion_recomendada: derivar_urgencias | priorizar_hoy | cita_48h | seguimiento_programado.

## Criterios de aceptacion explicitos y verificables
1. Completitud minima
- Verificable: el proceso rechaza entradas sin patient_id, edad, sintomas_principales o fecha_hora_evaluacion.

2. Rango y formato
- Verificable: edad fuera de 0-120 o fecha no ISO-8601 produce error de validacion.

3. Consistencia de salida
- Verificable: prioridad_clinica siempre pertenece a critica/alta/media/baja y score_riesgo esta entre 0 y 100.

4. Trazabilidad clinica
- Verificable: output incluye al menos 1 razon textual y la accion_recomendada asociada.

5. Prioridad por senales criticas
- Verificable: si signos_alerta contiene sangrado_activo o saturacion_baja, la prioridad no puede ser media ni baja.
