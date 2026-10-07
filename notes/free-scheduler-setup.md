# Activación del seguimiento gratuito cada cinco minutos

La sincronización del Site lee `state/head.json` y los archivos cifrados por SHA. No consume la API REST de GitHub. El registro mantiene decisiones, eventos, barras, ticks y variantes separados; no cambia las fórmulas originales ni aprende parámetros en producción.

La programación nativa de GitHub queda como respaldo: no garantiza cinco minutos. El programador externo está preparado, **pendiente de activación en una cuenta del propietario**. No se ha creado ninguna cuenta ni contratado servicios. cron-job.org permite programación gratuita cada minuto; se propone cada cinco. Tampoco ofrece garantía de puntualidad.

1. Crear o abrir una cuenta gratuita en <https://console.cron-job.org/signup> y confirmar el correo.
2. En <https://github.com/settings/personal-access-tokens/new>, crear un token fine-grained con propietario `libiliving-rgb`, **Only select repositories → libi-xau-wake** y permiso **Actions: Read and write**. Usar una caducidad explícita. Metadata se incluye automáticamente. No conceder Contents, Secrets ni Administration. No escribir el token en la conversación, el repositorio, el cuerpo ni la URL; va exclusivamente en el encabezado privado del programador.
3. Crear un trabajo `LiBi XAU · cinco minutos`, activado, cada cinco minutos, con este destino y configuración avanzada:

| Campo | Valor |
|---|---|
| URL | `https://api.github.com/repos/libiliving-rgb/libi-xau-wake/actions/workflows/xau-wake.yml/dispatches` |
| Método | `POST` |
| Accept | `application/vnd.github+json` |
| Content-Type | `application/json` |
| X-GitHub-Api-Version | `2026-03-10` |
| Authorization | `Bearer ` seguido del token privado |
| Cuerpo | `{"ref":"main"}` |

4. Ejecutar una prueba desde el programador. La respuesta de GitHub debe ser 200 o 204; eso solo acredita aceptación del disparo. Verificar que aparece una ejecución `workflow_dispatch` completada en <https://github.com/libiliving-rgb/libi-xau-wake/actions/workflows/xau-wake.yml>, que cambian `state/head.json` y la revisión cifrada, y que la app importa esa revisión sin referencia manual.
5. Medir al menos seis disparos consecutivos: intervalos de observación y latencia de última vela. No presentar cinco minutos como verificados antes de medirlos. Mantener la programación nativa de respaldo durante la comprobación; el grupo de concurrencia conserva un solo escritor. El cálculo evita archivar dos veces una entrada idéntica. Sin bucles de reintento inmediato.

Si el trabajo devuelve 401/403 al caducar el token, renovarlo en el encabezado. La pantalla conserva la hora real de la última decisión y avisa cuando queda antigua. Los eventos observados en velas históricas mantienen su intervalo y la hora de registro; los avisos de entrada antiguos o de planes ya terminados se descartan, pero sus resultados se conservan para evaluación.

Referencias: <https://cron-job.org/en/faq/>; <https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event>; <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule>.

La referencia directa de Git por HTTP (`info/refs?service=git-upload-pack`) es la primera opción del Site: solo anuncios de nombres y SHA, sin clonar objetos ni consumir REST. Se valida el encuadre pkt-line y main. `state/head.json` queda como respaldo; su hora de publicación limita la frescura para evitar que una caché pública antigua parezca recién comprobada.
