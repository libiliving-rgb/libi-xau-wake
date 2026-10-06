# Programador gratuito alternativo: preparado, sin activar

El cron nativo de GitHub ha producido intervalos reales de 23–25 min. El workflow ya acepta workflow_dispatch. Una alternativa gratuita es cron-job.org, que admite POST, cabeceras y frecuencias de un minuto; se propone empezar con cinco minutos. Su FAQ también declara que no garantiza puntualidad: https://cron-job.org/en/faq/ (consultada 06-10-2026).

La activación requiere una cuenta gratuita del usuario y un token GitHub fine-grained, limitado SOLO a `libiliving-rgb/libi-xau-wake` con permiso de repositorio Actions: read/write. Nunca dar Contents/Secrets/Administration ni usar un token de Floot/Sites. Crear y guardar el token únicamente en la consola privada del programador; no pegarlo en conversación, código, notas o URLs. Caducidad explícita y revocación al retirar el programador. No se ha creado una cuenta ni un programador externo durante este trabajo.

Configuración exacta revisable:
- URL: https://api.github.com/repos/libiliving-rgb/libi-xau-wake/actions/workflows/xau-wake.yml/dispatches
- Método: POST
- Cabeceras: Accept = application/vnd.github+json; Content-Type = application/json; X-GitHub-Api-Version = 2026-03-10; Authorization = Bearer [token limitado, solo en campo privado]
- Cuerpo: {"ref":"main"}
- Intervalo inicial: cinco minutos, sin bucles ni reintentos inmediatos.
- Validación: HTTP de aceptación 200/204, run workflow_dispatch real finalizado y persistido, horas reales, latencia de barras y avisos. HTTP de aceptación por sí solo no prueba puntualidad ni entrega.

Mantener el cron nativo hasta medir el externo y resolver cualquier concurrencia; el grupo único y las claves de eventos protegen el estado. Después elegir un solo disparador y dejar el fallback explícito. No asumir que un disparo manual representa la cadencia programada; separar en el análisis `workflow_dispatch` de `schedule`.

Fuentes oficiales: https://docs.github.com/en/rest/actions/workflows . Falta acceso a la cuenta del programador; no se promete protección intradía ni puntualidad de cinco minutos.
