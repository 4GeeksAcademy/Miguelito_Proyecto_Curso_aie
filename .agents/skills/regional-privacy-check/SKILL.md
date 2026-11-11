# Skill: Regional Privacy Check

## Objetivo unico
Validar que una accion sobre datos clinicos cumpla reglas de privacidad y acceso segun region y rol de usuario antes de ejecutarse.

## Cuando usar esta skill
Usar en tareas recurrentes de lectura, edicion, exportacion o comparticion de historia clinica entre apps, servicios y automatizaciones.

## Inputs documentados
1. region
- Tipo: string.
- Ejemplo: CO, MX, ES.
- Uso: seleccionar politica regulatoria aplicable.

2. actor_rol
- Tipo: string.
- Valores esperados: paciente, medico, admin_clinico, soporte.

3. accion
- Tipo: string.
- Valores esperados: leer, crear, actualizar, exportar, compartir.

4. data_scope
- Tipo: string.
- Valores esperados: datos_basicos, historial_clinico, tratamiento, notas_privadas.

5. consentimiento_vigente
- Tipo: boolean.
- Uso: confirmar autorizacion del paciente cuando aplique.

6. motivo_acceso
- Tipo: string.
- Ejemplo: continuidad_asistencial, auditoria_interna.

7. ticket_o_solicitud_id
- Tipo: string.
- Uso: trazabilidad operativa.

## Output esperado
- decision: permitido | denegado | requiere_revision.
- motivo_decision: texto corto y claro.
- controles_requeridos: lista de controles (por ejemplo, enmascarar_datos, doble_aprobacion).
- evidencia_auditoria: campos minimos para registro de auditoria.

## Criterios de aceptacion explicitos y verificables
1. Validacion de rol y accion
- Verificable: si actor_rol o accion no estan en catalogo, la salida debe ser denegado.

2. Regla de consentimiento
- Verificable: para compartir o exportar historial_clinico sin consentimiento_vigente, la salida debe ser denegado.

3. Estandar de salida
- Verificable: toda respuesta contiene decision, motivo_decision y al menos un campo de evidencia_auditoria.

4. Trazabilidad
- Verificable: ticket_o_solicitud_id vacio invalida la evaluacion.

5. Control de minimo privilegio
- Verificable: si actor_rol es soporte y data_scope es notas_privadas, la salida no puede ser permitido.
