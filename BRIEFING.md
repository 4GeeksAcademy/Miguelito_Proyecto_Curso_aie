# Briefing del proyecto — HealthCore

## Resumen ejecutivo

HealthCore es una red de atención ambulatoria que busca modernizar su operación mediante software, datos e inteligencia artificial. Opera 12 clínicas — nueve en Estados Unidos y tres en el Reino Unido— y atiende bajo marcos regulatorios diferentes: HIPAA y UK GDPR. Sus sistemas clínicos, de citas y facturación están fragmentados, lo que dificulta coordinar la atención, medir resultados y proteger los datos de forma consistente.

El proyecto académico plantea construir capacidades digitales que ayuden a mejorar la experiencia del paciente y la eficiencia operativa sin comprometer la seguridad, la privacidad ni la supervisión clínica.

## La organización

- **Liderazgo:** Dra. Sandra Okonkwo, CEO.
- **Operaciones clínicas:** Dr. Marcus Reid; aproximadamente 120 profesionales clínicos en 12 sedes.
- **Experiencia del paciente y acceso:** Priya Nair.
- **Ciclo de ingresos y facturación:** Tom Callahan.
- **Cumplimiento y gobierno del dato:** Claire Whitfield.
- **Personas y fuerza laboral:** Diane Foster.
- **Tecnología:** James Osei (CTO), con un equipo de seis personas.
- **Tamaño y alcance:** aproximadamente 200 empleados y 28 millones de dólares de facturación anual; clínicas en Texas, Florida, Georgia, Londres y Mánchester.

## Problemas prioritarios

1. **Datos clínicos aislados:** dos plataformas EHR separadas por país que no intercambian información.
2. **Acceso y continuidad del cuidado:** reservas telefónicas o manuales, sin una plataforma online unificada; tasa de inasistencia del 22%.
3. **Carga administrativa clínica:** el personal dedica alrededor de 35 minutos diarios a documentación que podría recibir asistencia tecnológica.
4. **Ingresos:** en EE. UU., el 14% de las reclamaciones se rechaza; la facturación del Reino Unido se gestiona por separado.
5. **Cumplimiento:** registros de acceso y auditoría dispersos, con obligaciones distintas en cada jurisdicción.
6. **Gestión de personal:** contratación clínica con un promedio de 47 días y seguimiento manual de formación obligatoria.
7. **Visibilidad ejecutiva:** informes semanales tardíos y heterogéneos, sin indicadores operativos compartidos.

## Visión de solución

La visión es evolucionar hacia servicios y herramientas integrados que permitan:

- Organizar pacientes, encuentros, tratamientos, citas y remisiones con trazabilidad.
- Dar continuidad a la atención entre sedes, respetando las reglas de acceso y privacidad de cada región.
- Reducir tareas administrativas y facilitar recordatorios y seguimiento.
- Ofrecer indicadores consistentes para las áreas clínicas, operativas y financieras.
- Explorar IA de forma acotada y supervisada para priorización, documentación y recomendaciones de seguimiento.

La IA no sustituye el juicio clínico. Toda recomendación de impacto clínico debe ser revisable, contextualizada y trazable.

## Estado actual del repositorio

El repositorio contiene una base de monorepo con documentación de HealthCore, utilidades TypeScript compartidas y una aplicación Next.js en `uis/talent-pipeline-tracker/`. Esa aplicación implementa actualmente un **seguimiento de candidatos de talento** (tablero, fichas, formularios y notas), no los flujos clínicos descritos en la visión de HealthCore. Por tanto, el alcance implementado y el contexto empresarial todavía no están plenamente alineados; cualquier evolución debe aclarar si el tracker es un entregable independiente, una herramienta interna de RR. HH. para HealthCore o una base que se transformará en otro producto.

### Tecnologías visibles

- **Frontend existente:** Next.js, React y TypeScript, dentro de `uis/talent-pipeline-tracker/`.
- **Código compartido:** tipos y utilidades TypeScript en `packages/shared/` y `src/`.
- **Validación raíz disponible:** `npm run validate:ts`.
- **Backend, persistencia e integración clínica:** no se identifican como una API central implementada en la estructura actual; deben tratarse como trabajo pendiente, no como capacidades existentes.

## Principios y restricciones

- Proteger los datos sanitarios y aplicar acceso por rol y jurisdicción.
- Registrar quién accede o modifica información sensible, cuándo y qué cambió.
- No compartir datos entre sistemas o países sin definir antes la base legal, los controles y el propósito.
- Minimizar los datos utilizados en pruebas, demostraciones y funciones de IA; no incluir información real de pacientes en el repositorio.
- Diseñar integraciones de manera progresiva y documentar supuestos, límites y procedencia de los datos.
- Mantener revisión humana para decisiones y recomendaciones clínicas.

## Próximos pasos sugeridos

1. Acordar y documentar el alcance del producto que se construirá primero; resolver la relación entre el tracker de candidatos existente y la visión de HealthCore.
2. Definir un MVP y sus usuarios, procesos y métricas de éxito.
3. Diseñar el modelo mínimo de datos y los permisos antes de implementar funcionalidades con datos sensibles.
4. Prototipar un flujo de extremo a extremo con datos ficticios —por ejemplo, gestión de una cita y su recordatorio— y documentar auditoría y límites regulatorios.
5. Validar cada módulo con las verificaciones adecuadas y mantener actualizados los documentos de arquitectura y progreso.

## Documentos relacionados

- Contexto detallado de empresa: `CONTEXT.es.md`.
- Resumen funcional y objetivos iniciales: `memory-bank/projectbrief.md`.
- Tecnologías, decisiones y restricciones: `memory-bank/techContext.md`.
- Estado y próximos pasos registrados: `memory-bank/progress.md`.
- Guía general del repositorio: `README.es.md`.
