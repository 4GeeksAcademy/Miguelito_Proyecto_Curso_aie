# Briefing del proyecto — HealthCore

## Resumen

HealthCore es una empresa de atención sanitaria ambulatoria fundada en 2011 y con sede en Austin, Texas. Opera 12 clínicas: 9 en Estados Unidos (Texas, Florida y Georgia) y 3 en el Reino Unido (Londres y Manchester). Atiende consultas de atención primaria y especializada, gestión de enfermedades crónicas y programas preventivos. Cuenta con aproximadamente 200 empleados y unos ingresos anuales de 28 millones de dólares.

La empresa se distingue por ofrecer citas rápidas, horarios extendidos y atención bilingüe en sus mercados estadounidenses. Su crecimiento, sin embargo, ha superado la capacidad de sus sistemas y procesos actuales.

## Situación actual

- Las clínicas de EE. UU. y Reino Unido usan plataformas de historia clínica electrónica (EHR) distintas, sin interoperabilidad.
- Las citas se gestionan por teléfono en EE. UU. y mediante agendas manuales en Reino Unido; no hay una plataforma común de reservas en línea.
- La tasa de inasistencia es del **22 %**, con una pérdida estimada de **1,8 millones de dólares al año** en espacios de consulta desaprovechados.
- En EE. UU., el **14 % de las reclamaciones** de seguros se deniega, frente a un promedio del sector del 5–8 %.
- El personal clínico dedica unos **35 minutos diarios** a tareas de documentación administrativa.
- La formación de cumplimiento y las horas de educación médica continua (CME) se controlan manualmente.
- Los datos, registros de auditoría e informes están repartidos entre herramientas no integradas y suelen llegar con varios días de retraso.

## Objetivo de HealthCore Digital

Diseñar y desarrollar sistemas, flujos de trabajo y herramientas inteligentes que permitan operar como una organización sanitaria moderna: segura, eficiente y centrada en el paciente. La tecnología debe ayudar a integrar la operación de las 12 clínicas y facilitar decisiones oportunas, sin comprometer la privacidad ni la seguridad clínica.

## Áreas prioritarias

1. **Operaciones clínicas:** API unificada para consultar información de pacientes, historial entre ubicaciones, asistencia a la documentación clínica y panel de operaciones.
2. **Experiencia y acceso del paciente:** reservas en línea, recordatorios y reprogramación proactiva, predicción de riesgo de inasistencia y métricas de experiencia.
3. **Facturación y ciclo de ingresos:** revisión asistida de reclamaciones, sugerencias de codificación, análisis de denegaciones y vista consolidada de ingresos de EE. UU. y Reino Unido.
4. **Cumplimiento y gobierno de datos:** auditoría centralizada, seguimiento de accesos, gestión de solicitudes de datos y detección temprana de riesgos.
5. **Personas y fuerza laboral:** incorporación, seguimiento de credenciales y CME, autoservicio de RR. HH. e indicadores de contratación y ausentismo.
6. **Tecnología y liderazgo:** API y capa de datos compartidas, telemetría de las clínicas, alertas operativas, panel ejecutivo e informes periódicos.

## Restricciones y principios

- **Privacidad y cumplimiento:** cumplir con HIPAA en Estados Unidos y UK GDPR en el Reino Unido. Aplicar acceso mínimo necesario, trazabilidad y protección de datos desde el diseño.
- **Seguridad clínica:** las herramientas de IA deben asistir al personal, no sustituir decisiones clínicas. Las sugerencias y automatizaciones de impacto requieren revisión humana y evaluación adecuada.
- **Operación internacional:** contemplar dos jurisdicciones, sistemas existentes y diferencias entre los procesos de facturación y atención.
- **Integración incremental:** conectar los sistemas actuales mediante interfaces y una capa común de datos; evitar reemplazos amplios sin una necesidad justificada.
- **Datos sensibles:** usar datos sintéticos o debidamente desidentificados durante el desarrollo y las pruebas; no incluir información de pacientes en repositorios ni registros innecesarios.

## Actores principales

| Área | Responsable | Necesidad destacada |
| --- | --- | --- |
| Dirección ejecutiva | Dra. Sandra Okonkwo, CEO | Visibilidad fiable y actualizada de los indicadores de toda la red |
| Operaciones clínicas | Dr. Marcus Reid | Historial accesible y menor carga administrativa |
| Experiencia y acceso | Priya Nair | Reducir inasistencias y simplificar reservas y seguimiento |
| Facturación | Tom Callahan | Reducir denegaciones y unificar la visión financiera |
| Cumplimiento | Claire Whitfield | Auditoría, privacidad y respuesta a solicitudes de datos |
| Personas | Diane Foster | Mejorar contratación, incorporación y control de CME |
| Tecnología | James Osei, CTO | Integrar sistemas, datos, monitorización y alertas |

## Criterio de éxito

Las soluciones deben mejorar resultados operativos medibles —como inasistencias, denegaciones, tiempo administrativo y oportunidad de los informes— y, al mismo tiempo, mantener controles verificables de privacidad, seguridad y supervisión humana.

> Este archivo resume el contexto del proyecto. Para los detalles completos del escenario, requisitos por departamento y narrativa de la empresa, consulta [`CONTEXT.md`](./CONTEXT.md).
