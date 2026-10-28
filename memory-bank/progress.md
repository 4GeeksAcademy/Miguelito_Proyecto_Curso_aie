# Progress

## Estado actual del desarrollo
- Empresa objetivo definida: HealthCore.
- Vision funcional definida para dos productos:
  - App Paciente.
  - App Medico.
- Requisitos iniciales identificados:
  - Organizacion de datos por region, sede y paciente.
  - Priorizacion de urgencia medica y casos de alto riesgo.
  - Recordatorios y seguimiento post consulta.
- Estructura de monorepo y documentacion base ya disponible para arrancar implementacion.

## Proximos pasos previstos
1. Volcar el contexto completo de HealthCore en CONTEXT.md con actores, procesos y reglas por region.
2. Definir modelo minimo de datos clinicos:
   - Paciente, historial, consulta, tratamiento, riesgo, remision.
3. Construir MVP end-to-end del flujo de cita:
   - Registro paciente.
   - Agenda de medico.
   - Carga de nota clinica.
4. Implementar primer modulo de IA:
   - Priorizacion de pacientes por riesgo/urgencia.
5. Activar workflow de recordatorio de citas y seguimiento de tratamiento.
6. Definir metricas iniciales:
   - Tiempo promedio de atencion.
   - Tasa de inasistencia.
   - Tiempo de espera para especialidad.
