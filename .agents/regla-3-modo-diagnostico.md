# Regla 3: Modo diagnostico guiado

- Alcance de aplicacion: solicitada por el agente.
- Condicion de activacion: cuando el agente detecta errores recurrentes o incertidumbre alta tras intentos de solucion.

## Descripcion
El agente pausa cambios amplios y realiza diagnostico incremental con evidencia minima (error, causa probable, siguiente prueba).

## Criterios de cumplimiento
- Limitar intentos repetidos sin nueva evidencia.
- Reportar bloqueo y opciones de salida.
- Esperar confirmacion del desarrollador para cambios de mayor impacto.
