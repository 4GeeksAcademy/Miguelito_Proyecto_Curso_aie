# Propuesta de arquitectura backend para HealthCore

> **Estado:** propuesta, no implementada.  
> **Alcance:** backend de HealthCore exclusivamente. La aplicación de seguimiento de candidatos existente queda fuera de esta arquitectura.

## 1. Patrón arquitectónico recomendado

Se propone un **monolito modular con arquitectura hexagonal (Ports and Adapters)**, organizado por dominios de negocio y desplegado inicialmente como una API central de FastAPI. Los procesos de fondo podrían añadirse como workers cuando un caso de uso lo requiera, sin convertir cada dominio en un microservicio desde el inicio.

### Justificación vinculada a HealthCore

- **Integraciones heterogéneas:** las clínicas de EE. UU. y Reino Unido usan dos plataformas EHR que hoy no intercambian información. También hay sistemas de facturación diferentes y procesos de agenda manuales. Los adaptadores de salida permiten encapsular los protocolos y particularidades de cada sistema, mientras que los casos de uso del negocio dependen de puertos estables.
- **Operación en dos jurisdicciones:** HealthCore debe cumplir HIPAA en EE. UU. y UK GDPR en Reino Unido. Separar el dominio de los adaptadores facilita aplicar políticas específicas en los límites de acceso, almacenamiento e integración. La arquitectura por sí sola no determina cumplimiento ni implica que los datos deban centralizarse en una sola región; esas decisiones requieren evaluación legal y de seguridad.
- **Equipo tecnológico pequeño:** el equipo descrito cuenta con seis personas. Un único backend modular reduce el coste de despliegue, monitorización y coordinación frente a una arquitectura inicial de microservicios, conservando límites internos que permiten evolucionar módulos por separado.
- **Necesidades transversales y trazabilidad:** pacientes, citas, encuentros, facturación y auditoría están relacionados. Casos de uso explícitos y límites de dominio ayudan a mantener coherencia y registrar quién accede o modifica información sensible.
- **Evolución progresiva:** el proyecto contempla capacidades que todavía no existen en una API central, como consolidación de datos e IA. El monolito permite entregar primero un flujo acotado y extraer un componente más adelante solo si la escala, el aislamiento regulatorio o las necesidades operativas lo justifican.

### Qué significa “hexagonal” en esta propuesta

Cada módulo separa:

- **Dominio:** conceptos y reglas propias del negocio, sin dependencia de FastAPI, de una base de datos concreta ni de proveedores externos.
- **Aplicación:** casos de uso y puertos que expresan las capacidades requeridas por el dominio, por ejemplo reservar una cita o consultar una remisión.
- **Adaptadores de entrada:** interfaces que invocan los casos de uso, inicialmente routers HTTP de FastAPI.
- **Adaptadores de salida:** implementaciones de los puertos, como persistencia, EHR, facturación, identidad o notificaciones.

El objetivo no es crear una abstracción para cada función trivial, sino proteger los límites que pueden cambiar, que son externos o que tienen especial impacto en seguridad y pruebas.

## 2. Estructura propuesta de carpetas y módulos

La API viviría bajo `services/healthcore-api/`, siguiendo la convención del repositorio de ubicar servicios ejecutables en `services/`. El frontend Next.js de HealthCore sería una aplicación separada dentro de `uis/`; compartir monorepo no significa compartir proceso, dependencias ni ciclo de despliegue. Esta es una estructura objetivo; no implica que esas carpetas o capacidades ya estén implementadas.

```text
uis/
  healthcore-portal/             # Frontend Next.js; nombre de ejemplo
services/
  healthcore-api/
    app/
      main.py                     # Ensamblaje de FastAPI y registro de routers
      core/                       # Configuración, errores y políticas comunes
      infrastructure/             # Proveedores técnicos compartidos
        database/
        identity/
        observability/
      modules/
        patients/
        appointments/
        clinical_records/
        referrals/
        billing/
        workforce/
        compliance/
        reporting/
      integrations/               # Conectores y traducción de sistemas externos
        ehr_us/
        ehr_uk/
        billing_us/
        billing_uk/
        notifications/
    migrations/                   # Evolución versionada del esquema persistido
    tests/
      unit/
      integration/
      contract/
```

Cada módulo de negocio seguiría el mismo criterio interno, adaptado a su complejidad:

```text
modules/<dominio>/
  domain/                         # Entidades, reglas e invariantes
  application/                    # Casos de uso y puertos
  adapters/
    inbound/http/                 # Routers y esquemas HTTP del dominio
    outbound/                     # Adaptadores de salida cuando pertenezcan al módulo
```

No todos los módulos necesitan comenzar con todas las subcarpetas. Se crearían a medida que haya casos de uso concretos, evitando estructura vacía y abstracciones prematuras.

### Convenciones FastAPI y procedencia de la estructura

FastAPI documenta la organización de aplicaciones grandes en varios módulos usando `APIRouter` y un punto de composición que los incorpora con `include_router()`. La estructura propuesta toma esa convención de modularidad de rutas y la extiende con límites de dominio y capas hexagonales para las necesidades de HealthCore. **FastAPI no prescribe una única estructura de carpetas**: `app/`, los nombres de módulos y la separación dominio/aplicación/adaptadores son decisiones de proyecto, no requisitos del framework.

También se propone reservar `app.mount()` para montar una subaplicación ASGI realmente independiente, si en algún momento se necesita; no como sustituto de `include_router()` para rutas que son parte de la misma API. Las dependencias de FastAPI pueden suministrar capacidades compartidas de transporte o infraestructura, como identidad/autorización y sesiones de persistencia, pero los casos de uso y reglas de dominio deben permanecer fuera de los routers. En la estructura ilustrativa, `modules/<dominio>/application/` define los puertos y `integrations/` aloja adaptadores externos compartidos o específicos de cada proveedor; los adaptadores de persistencia pueden quedar junto al módulo cuando son propios de su dominio. Así, `integrations/` no reemplaza los límites de dominio ni se convierte en el lugar de las reglas de negocio.

Estas convenciones se basan en la documentación oficial de [FastAPI para aplicaciones grandes y múltiples archivos](https://fastapi.tiangolo.com/tutorial/bigger-applications/), [subaplicaciones y montajes](https://fastapi.tiangolo.com/advanced/sub-applications/) y [dependencias](https://fastapi.tiangolo.com/tutorial/dependencies/). Se citan como guía oficial y origen de los mecanismos mencionados, no como una plantilla obligatoria.

### Coexistencia de frontend y backend separados

El frontend (Next.js) y el backend (FastAPI) se tratarían como aplicaciones desplegables de forma independiente, por ejemplo `uis/healthcore-portal/` y `services/healthcore-api/`. El monorepo puede alojar ambos, pero cada uno conserva sus dependencias, configuración y ciclo de despliegue. El backend define y mantiene los contratos, valida entradas y aplica autenticación, autorización, auditoría y reglas de negocio; el frontend no accede directamente a la base de datos ni sustituye los controles del servidor. OpenAPI puede servir como contrato documentado para los consumidores de la API, sin acoplar sus dependencias o ciclos de despliegue.

La comunicación puede configurarse de dos maneras, según el despliegue:

- **Orígenes separados:** el navegador llama a la URL de la API y, si el origen (protocolo, host o puerto) difiere del del frontend, el backend debe permitir explícitamente ese origen mediante CORS. Por ejemplo, desarrollo local podría usar un origen del frontend como `http://localhost:3000` y otro para FastAPI como `http://localhost:8000`.
- **Mismo origen mediante proxy o gateway:** el navegador llama a una ruta relativa del mismo dominio y el proxy enruta internamente hacia FastAPI. En este caso, puede no ser necesario habilitar CORS entre navegador y API, aunque el proxy debe configurarse correctamente.

Si una página o acción de Next.js invoca FastAPI desde código que corre en el servidor (por ejemplo, una petición servidor-a-servidor), CORS del navegador no gobierna esa llamada; sí aplican conectividad, autenticación, autorización y controles del backend. Si el JavaScript del navegador llama directamente a FastAPI, aplica CORS cuando los orígenes difieren. La elección entre proxy/BFF y llamada directa depende del modelo de sesión, despliegue y necesidades del producto.

CORS es una política del navegador para solicitudes entre orígenes; no es autenticación ni autorización y no protege la API frente a clientes que no son navegadores. En producción se deben declarar orígenes permitidos explícitos. Si se usan cookies o credenciales, no debe dependerse de comodines: se deben configurar explícitamente orígenes, métodos y encabezados autorizados y definir las protecciones de sesión correspondientes. FastAPI documenta [`CORSMiddleware`](https://fastapi.tiangolo.com/tutorial/cors/) y Starlette documenta sus [opciones de middleware CORS](https://www.starlette.io/middleware/#corsmiddleware).

### Configuración y variables de entorno

La configuración del backend debe ser propia de `services/healthcore-api/`, tipada y validada al iniciar. Se propone usar `pydantic-settings` (`BaseSettings`) para leer variables del entorno y, opcionalmente, un archivo local `.env` para desarrollo. Entre los valores configurables estarían las URLs públicas/permitidas del frontend, URL de API o servicios externos, configuración de base de datos, proveedor de identidad, límites de timeout y nivel de logging. Los secretos no deben escribirse en el repositorio ni exponerse mediante variables públicas del frontend.

El frontend debe tener su propia configuración de entorno para saber qué URL de API consumir. En Next.js, las variables prefijadas `NEXT_PUBLIC_` se incorporan al bundle del navegador durante el build; no deben contener secretos y cambiar su valor suele requerir generar un nuevo build. Si se necesita configuración dinámica en tiempo de ejecución, debe servirse desde el servidor de Next.js o resolverse mediante la configuración de despliegue, no tratarse como una variable pública secreta. El nombre y mecanismo concretos se definirán al implementar. En desarrollo local, variables como `FRONTEND_ORIGINS` (backend) y `NEXT_PUBLIC_API_BASE_URL` (frontend) podrían representar esos valores; son ejemplos, no nombres fijados por FastAPI.

La guía oficial de FastAPI describe configuración mediante variables de entorno y `pydantic-settings` en [Settings and Environment Variables](https://fastapi.tiangolo.com/advanced/settings/); la referencia del paquete está en [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/). Next.js explica el alcance de las variables públicas y el archivo `.env` en su guía de [variables de entorno](https://nextjs.org/docs/app/guides/environment-variables). El `.env` se considera una comodidad local: en entornos desplegados, la plataforma de ejecución o un gestor de secretos debe suministrar la configuración sensible.

### Criterio de separación por dominio

- **`patients`:** identidad funcional y datos de referencia del paciente necesarios para los procesos de HealthCore. El acceso a información clínica detallada debe limitarse por rol, sede, propósito y jurisdicción; no se propone una vista irrestricta de todos los pacientes.
- **`appointments`:** disponibilidad, reserva, cancelación, reprogramación y estado de citas. Las reglas de agenda no deben quedar ligadas a cómo cada sede lleva hoy su calendario.
- **`clinical_records`:** encuentros, notas y elementos clínicos que el alcance aprobado permita manejar. Requiere controles reforzados, trazabilidad y revisión de requisitos regulatorios antes de integrar datos reales.
- **`referrals`:** remisiones y coordinación entre profesionales o especialidades, con su estado y contexto autorizado.
- **`billing`:** procesos de cobro y reclamaciones. Las reglas y adaptadores pueden diferir entre EE. UU. y Reino Unido; las diferencias regulatorias y de pagadores no deben ocultarse en una lógica genérica que asuma equivalencia.
- **`workforce`:** información operativa de personal, credenciales y formación obligatoria, sin mezclarla con los registros de pacientes.
- **`compliance`:** solicitudes de acceso o exportación de datos y consulta controlada de eventos de auditoría. La generación de auditoría debe ser transversal a las operaciones sensibles; no depender solo de que un usuario invoque un endpoint.
- **`reporting`:** consultas y agregados operativos autorizados. Los informes ejecutivos deben consumir datos minimizados o agregados cuando no necesiten información identificable.
- **`integrations`:** conectores con los EHR, plataformas de facturación y proveedores de notificación. Su responsabilidad es traducir contratos externos a los puertos internos, evitando que sus formatos contaminen el dominio.
- **`infrastructure`:** capacidades técnicas compartidas —persistencia, identidad y observabilidad—, no reglas específicas de pacientes, citas o facturación.

### Límites y políticas transversales

- La autenticación debe delegarse en un proveedor de identidad apropiado; la API aplica autorización por rol y contexto, como sede, región y finalidad de acceso.
- Las decisiones sobre residencia, partición o intercambio transfronterizo de datos deben definirse antes de elegir el despliegue y el modelo de persistencia. Un backend único no obliga a que todos los datos residan en una única base o jurisdicción.
- Las operaciones sensibles requieren auditoría con actor, momento, acción y recurso afectado, además de controles de acceso y retención acordes con los requisitos aprobados.
- Los adaptadores externos deben manejar credenciales, errores, disponibilidad y diferencias de contrato sin exponer esos detalles a los módulos de negocio.
- La IA no debe tomar decisiones clínicas autónomas. Cualquier recomendación debe tener propósito definido, procedencia y trazabilidad, y conservar supervisión humana.

## 4. Organización de endpoints y routers de FastAPI

Los endpoints se agruparían por **dominio y recurso**, no por tipo de usuario ni por tecnología de persistencia. La API expondría una versión estable bajo `/api/v1`; los routers de cada módulo se montarían bajo ese prefijo. Los nombres siguientes son una propuesta conceptual, no un contrato final.

| Router / grupo | Rutas propuestas | Criterio de agrupación |
| --- | --- | --- |
| Salud del servicio | `GET /health`, `GET /ready` | Comprobaciones técnicas para operación y despliegue. No exponen datos de negocio ni detalles sensibles del sistema. |
| Pacientes | `GET /api/v1/patients`, `POST /api/v1/patients`, `GET /api/v1/patients/{patient_id}`, `PATCH /api/v1/patients/{patient_id}` | Consulta y mantenimiento de datos de referencia autorizados. Las respuestas deben limitarse según rol, contexto y propósito; no representarían automáticamente el expediente clínico completo. |
| Citas | `GET /api/v1/appointments`, `POST /api/v1/appointments`, `GET /api/v1/appointments/{appointment_id}`, `PATCH /api/v1/appointments/{appointment_id}`, `POST /api/v1/appointments/{appointment_id}/cancel`, `GET /api/v1/appointments/availability` | Operaciones del ciclo de vida de una cita y consulta de disponibilidad. Se agrupan aquí porque comparten reglas de agenda y autorización. |
| Registros clínicos | `GET /api/v1/encounters`, `POST /api/v1/encounters`, `GET /api/v1/encounters/{encounter_id}`, `POST /api/v1/encounters/{encounter_id}/notes` | Encuentros y documentación clínica. Acceso restringido al personal autorizado y sujeto a políticas de jurisdicción y auditoría. No se debe abrir acceso general a notas mediante filtros amplios. |
| Remisiones | `GET /api/v1/referrals`, `POST /api/v1/referrals`, `GET /api/v1/referrals/{referral_id}`, `PATCH /api/v1/referrals/{referral_id}` | Creación y seguimiento de remisiones; separado de encuentros porque tiene su propio ciclo de coordinación y estado. |
| Facturación | `GET /api/v1/billing/claims`, `POST /api/v1/billing/claims`, `GET /api/v1/billing/claims/{claim_id}`, `GET /api/v1/billing/invoices`, `GET /api/v1/billing/summary` | Operaciones y consultas financieras autorizadas. Los flujos específicos de EE. UU. y Reino Unido se validarán según pagadores y sistemas locales; los endpoints no deben presuponer que reclamaciones e invoices son equivalentes. |
| Personal | `GET /api/v1/workforce/staff`, `GET /api/v1/workforce/staff/{staff_id}`, `GET /api/v1/workforce/training`, `PATCH /api/v1/workforce/training/{record_id}` | Datos de personal, credenciales y formación. Se separan de pacientes porque el propósito, la sensibilidad y los permisos son diferentes. |
| Cumplimiento y solicitudes de datos | `POST /api/v1/data-requests`, `GET /api/v1/data-requests/{request_id}`, `GET /api/v1/audit-events` | Gestión de solicitudes de datos y consulta restringida de auditoría. La creación de eventos de auditoría será automática y transversal, no dependerá de una ruta pública de escritura. |
| Informes | `GET /api/v1/reports/operations`, `GET /api/v1/reports/appointments`, `GET /api/v1/reports/billing` | Lecturas y agregados operativos para usuarios autorizados. Las respuestas deben aplicar minimización de datos y filtros permitidos por sede y región. |
| Webhooks de integración | `POST /api/v1/integrations/{provider}/events` | Recepción controlada de eventos externos. Debe validar identidad/firma, idempotencia y contrato del proveedor; no es una puerta genérica para ejecutar acciones de dominio sin validación. |

### Criterios comunes para los routers

1. **Recursos y acciones:** usar rutas basadas en recursos para operaciones ordinarias; reservar rutas de acción —como cancelar cita— para transiciones de negocio que no sean una actualización parcial ambigua.
2. **Autorización en servidor:** verificar permisos en cada operación y recurso. Un `patient_id`, `clinic_id` o parámetro de región recibido en la URL no constituye autorización por sí mismo.
3. **Versionado y consistencia:** mantener el prefijo de versión (`/api/v1`) y convenciones uniformes de paginación, filtros, errores y validación. Los contratos finales se definirán con los consumidores.
4. **Separación de lecturas sensibles:** no devolver todos los datos relacionados en una única respuesta por conveniencia. Cada grupo de rutas responde a un propósito autorizado y minimiza lo expuesto.
5. **Adaptadores fuera de la API pública:** las rutas describen capacidades de HealthCore, no replican directamente los endpoints de cada EHR o proveedor financiero. Los adaptadores internos traducen entre ambos contratos.
6. **Procesos asíncronos:** recordatorios, sincronizaciones e informes programados podrán iniciarse desde casos de uso o eventos internos y ejecutarse en workers. No es necesario exponer un endpoint por cada tarea programada.

## 5. Riesgos y puntos de atención

Si el equipo no mantiene los límites de módulos y responsabilidades propuestos, pueden aparecer los siguientes riesgos:

1. **Acoplamiento a proveedores y sistemas heredados:** si los casos de uso llaman directamente a los EHR, sistemas de facturación o proveedores de notificaciones, sus formatos y fallos se propagarán por el dominio. Cambiar o sustituir una integración requeriría modificar lógica de negocio en varios lugares.
2. **Reglas de negocio dispersas o contradictorias:** si los routers, adaptadores y módulos duplican validaciones y reglas, una operación como reservar o cancelar una cita podría comportarse de forma distinta según la ruta o el sistema de origen, afectando la integridad de los datos.
3. **Exposición indebida de información sensible:** si no se aplican autorización contextual y minimización de datos en los límites de cada caso de uso, un usuario podría acceder a registros fuera de su rol, sede, jurisdicción o propósito. Esto aumentaría el riesgo de incidentes de privacidad y cumplimiento.
4. **Auditoría incompleta y baja capacidad de investigación:** si el registro de accesos y cambios depende de que cada endpoint lo implemente manualmente, algunas operaciones sensibles podrían quedar sin trazabilidad suficiente para investigar incidentes o atender solicitudes regulatorias.
5. **Complejidad prematura o monolito sin límites:** si se crean abstracciones y módulos sin necesidad, el desarrollo se ralentizará; si, por el contrario, se ignoran los límites de dominio y todo se concentra en una aplicación sin separación interna, crecerá el acoplamiento y será más difícil probar, cambiar o extraer componentes cuando haya una necesidad real.

## 6. Alcance de implementación recomendado

La propuesta no implica implementar todos los dominios a la vez. Conviene acordar un MVP —por ejemplo, gestión de citas con los permisos, auditoría e integración necesarios—, validar el flujo con datos ficticios y requisitos regionales definidos, y luego incorporar pacientes, registros clínicos, facturación y analítica según prioridades. Antes de manejar datos reales se deben concretar los controles de seguridad, retención, residencia y acceso con los responsables de cumplimiento de HealthCore.
