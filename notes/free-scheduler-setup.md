# Activación del seguimiento gratuito cada cinco minutos

La sincronización del Site consulta la referencia directa de Git por HTTP y lee los archivos cifrados por SHA; `state/head.json` queda como respaldo. No consume la API REST de GitHub. El registro mantiene decisiones, eventos, barras, ticks y variantes separados; no cambia las fórmulas originales ni aprende parámetros en producción.

La programación nativa de GitHub queda como respaldo: no garantiza cinco minutos. El programador externo está preparado, **pendiente de activación en una cuenta del propietario**. No se ha creado ninguna cuenta ni contratado servicios. cron-job.org permite programación gratuita cada minuto; se propone cada cinco. Tampoco ofrece garantía de puntualidad.

Costes comprobados el 7 de octubre de 2026 en la documentación oficial:

| Servicio | Coste de esta configuración | Condiciones |
|---|---|---|
| cron-job.org | Gratis | Un disparo cada cinco minutos son 12 por hora, dentro del límite de 60. No activar donaciones ni opciones de pago. |
| GitHub Actions | Gratis | Repositorio público `libiliving-rgb/libi-xau-wake`, ejecutor estándar `ubuntu-latest`. Este flujo no sube artefactos ni usa cachés o ejecutores grandes. |

El trabajo comprueba que `repository.private` sea explícitamente `false` antes de reservar un ejecutor. Si el repositorio se vuelve privado o falta ese dato, el trabajo se omite: no continuar con minutos privados de pago. Cambiar el ejecutor o añadir almacenamiento, proveedores o herramientas exige revisar de nuevo los costes y consultar al propietario antes de cualquier posible cargo. Si el alta pide tarjeta, suscripción, recarga o facturación, detener ese paso y consultar; no aceptar una prueba de pago.

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

Costes y límites: <https://cron-job.org/en/>; <https://cron-job.org/en/faq/>; <https://docs.github.com/en/billing/concepts/product-billing/github-actions>.

La referencia directa de Git por HTTP (`info/refs?service=git-upload-pack`) es la primera opción del Site: solo se leen los nombres y SHA, sin clonar objetos ni consumir REST. Se valida el encuadre pkt-line y la rama main. `state/head.json` queda como respaldo; su hora de publicación limita la frescura para evitar que una caché pública antigua parezca recién comprobada.
