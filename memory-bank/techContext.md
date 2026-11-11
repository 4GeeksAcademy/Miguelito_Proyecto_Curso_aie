# Tech Context

## Stack tecnologico
- Frontend:
  - App Paciente en Next.js/React para registro, citas y recordatorios.
  - App Medico en Next.js/React para agenda, historia clinica y remisiones.
- Backend: API central (FastAPI recomendada) con modulos de pacientes, consultas, especialidades, tratamientos y reportes.
- Lenguajes: TypeScript para UI y utilidades compartidas; Python para backend, pipelines y logica de IA.
- Datos: almacenamiento de historia clinica, clasificacion de riesgo, eventos de cita y auditoria por region/sede.
- IA:
  - Motor de priorizacion (urgencia medica y alto riesgo).
  - Recomendacion de seguimiento y recordatorios post consulta.
  - Soporte de organizacion clinica por paciente/especialidad.
- Automatizacion: workflows para notificaciones, tareas programadas y sincronizacion operativa.
- Infraestructura: contenedores Docker y configuraciones de despliegue por entorno.

## Decisiones de arquitectura tomadas
- Monorepo por dominios para separar UI, servicios, datos, IA e infraestructura.
- Backend central para evitar fragmentacion temprana y mantener reglas clinicas consistentes.
- Modelo de datos orientado a trazabilidad:
  - Paciente.
  - Encuentro clinico.
  - Tratamiento y seguimiento.
  - Remision y colaboracion entre especialistas.
- Componentes reutilizables en packages/shared para contratos de datos comunes.
- Documentacion por modulo para acelerar onboarding y mantenimiento.

## Restricciones tecnicas
- Cumplimiento de privacidad y confidencialidad medico-paciente por pais y region.
- Control estricto de acceso por rol (paciente, medico, admin clinico).
- Auditoria de cambios en datos sensibles (quien, cuando, que cambio).
- Evitar recomendaciones de IA sin contexto clinico minimo ni trazabilidad.
- Interoperabilidad progresiva con sistemas externos (laboratorios, farmacias, seguros).
- Alta disponibilidad para citas y acceso al historial clinico en sedes distribuidas.
