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

## Directorio de Proveedores (Compras y Suministros)

El Directorio de Proveedores registra proveedores de productos y servicios sanitarios o tecnológicos para las operaciones de HealthCore en Estados Unidos y Reino Unido. El contrato del modelo `Supplier` es:

| Campo | Tipo | Requisito |
| --- | --- | --- |
| `id` | `int` | Identificador asignado automáticamente por TinyDB. |
| `name` | `str` | Nombre comercial del proveedor; no puede estar vacío. |
| `country` | `str` | País de operación; ejemplos válidos en los datos iniciales: `USA` y `UK`. |
| `categories` | `list[str]` | Una o más categorías del catálogo válido indicado abajo. |
| `rate` | `float` | Tarifa base/unitaria vigente en USD o GBP; debe ser estrictamente mayor que cero. |
| `status` | `Enum` | Estado del proveedor: `"active"` o `"suspended"`. El valor predeterminado es `"active"`. |
| `updated_at` | `str` | Timestamp ISO 8601 en UTC, generado automáticamente por el servidor y no enviado por el cliente. |

Las categorías válidas son `"medical_supplies"`, `"pharma"`, `"diagnostics"`, `"it_infrastructure"` y `"ehr_services"`.

### Proveedores iniciales

| Nombre | País | Categorías | Tarifa | Estado |
| --- | --- | --- | ---: | --- |
| MedLine Clinical Supplies | `USA` | `medical_supplies`, `diagnostics` | 145.50 | `active` |
| Thames Valley Pharma Ltd | `UK` | `pharma`, `medical_supplies` | 210.00 | `active` |
| Apex Diagnostics Corp | `USA` | `diagnostics` | 320.75 | `active` |
| Britannia Health IT | `UK` | `it_infrastructure`, `ehr_services` | 480.00 | `active` |
| Sunbelt Surgical & Lab | `USA` | `medical_supplies` | 95.00 | `suspended` |
| Albion BioLogistics | `UK` | `pharma`, `diagnostics` | 175.25 | `active` |

## Especificación del Analizador de Incidencias

### Contrato de datos CSV

El fichero de entrada usa una fila de encabezados y estas columnas, en este orden:

| Campo | Requisito y formato |
| --- | --- |
| `incident_id` | Obligatorio; identificador con formato `INC-XXXXX` (cinco dígitos en los datos de referencia). Debe ser único en el fichero. |
| `created_at` | Obligatorio; fecha y hora ISO 8601. |
| `clinic_id` | Obligatorio; identificador de sede con prefijo `US-*` o `UK-*`. |
| `category` | Obligatorio; uno de los valores del catálogo indicado abajo. |
| `status` | Obligatorio; uno de los estados indicados abajo. |
| `priority` | Obligatorio; `baja`, `media`, `alta` o `critica`. |
| `customer_id` | Obligatorio; identificador del cliente. En los datos sintéticos se usan identificadores ficticios. |
| `customer_email` | Obligatorio; dirección con formato de correo electrónico. En los datos sintéticos se usa el dominio reservado `example.invalid`. |
| `resolved_at` | Opcional, salvo que `status` sea `cerrado`, en cuyo caso es obligatorio; fecha y hora ISO 8601 no anterior a `created_at`. |
| `satisfaction_score` | Opcional; entero entre `1` y `5`. Solo se incluye en el índice medio cuando el registro válido tiene estado `cerrado` y una puntuación registrada. |
| `description` | Opcional; texto libre que puede contener información sensible. No debe incluir datos reales en muestras, pruebas ni demostraciones; el analizador debe descartarlo de las salidas. |

Las categorías válidas (`category`) son `queja_atencion`, `solicitud_cita`, `solicitud_documentacion`, `fallo_facturacion` y `fallo_operativo`. Los estados válidos (`status`) son `abierto`, `cerrado`, `descartado` y `en_progreso`.

Un registro se considera inválido/corrupto y se excluye de las métricas si falta un campo obligatorio o su valor está vacío; `category`, `status` o `priority` no pertenece a su catálogo; una fecha no es válida o `resolved_at` es anterior a `created_at`; `satisfaction_score` no es un entero entre 1 y 5; `customer_email` no tiene formato válido; o `incident_id` está duplicado. Los rechazos deben poder auditarse por número de fila, identificador si está disponible y motivo, sin divulgar `customer_id`, `customer_email` ni `description`.

### Valores de control del dataset de referencia

La muestra sintética `data/incidents-HEALTHCORE.csv` contiene 100 registros de datos: 92 válidos y 8 inválidos/corruptos intencionales. Los conteos esperados son:

- Total leídos: **100** | Válidos: **92** | Inválidos/corruptos: **8**.
- Categorías válidas: `solicitud_cita` (30), `fallo_facturacion` (22), `queja_atencion` (18), `fallo_operativo` (12), `solicitud_documentacion` (10).
- Estados válidos: `cerrado` (55), `en_progreso` (20), `abierto` (12), `descartado` (5).
- Tasa de resolución esperada: **59.78%** (`55 / 92`), considerando como resueltos los registros `cerrado`.
- Índice de satisfacción medio esperado: **3.00** en los 55 registros válidos `cerrado` con puntuación registrada (11 puntuaciones de cada valor entero entre 1 y 5).

Todos los identificadores, correos, fechas y descripciones de la muestra son ficticios; no se incluyen datos reales de pacientes o clientes.

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
