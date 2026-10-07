# Comprobación del seguimiento

Fuente canónica de la app: https://libi-xau-gratis.libiliving.chatgpt.site . La app permanece privada para su propietario.

Los avisos usan `runner/push-runner.cjs`: configuración sellada al destinatario `state/push-public.json`, cuyo secreto privado solo existe dentro del estado AES-GCM con el secreto Actions existente. `state/push-config.json` contiene solo el sobre cifrado. Nunca incluir tokens del Site/Floot, endpoints de dispositivos ni claves privadas en claro.

Tras un alta/baja en Ajustes, un agente autorizado debe hacer POST owner-private `/api/push/connection`, transferir el sobre completo a `state/push-config.json` y actualizar main con expected_sha/force=false, conservando cambios concurrentes. Verificar el run por ese commit y sincronizar `/api/sync` para confirmar ids conectados y resultados. La configuración nueva no caduca por tiempo (expiresAt=null): permanece válida hasta revocación, baja o cambio de clave/época. Tras cualquier alta/baja hay que sincronizar de nuevo el sobre; nunca confundir una configuración vacía con avisos activos. Configuración aceptada, servicio push y recepción en móvil son estados diferentes. No enviar señales anteriores a una suscripción, falsas o con más de cinco minutos. No ejecutar órdenes de broker.

El cron de Actions no garantiza 5m: hubo intervalos programados reales de 25.108 y 23.172 min. Excluir push/dispatch al medir cron. El workflow ofrece workflow_dispatch para un programador externo ya autorizado; actualmente no existe ese acceso. Un HTTP de disparo exitoso no prueba puntualidad ni recepción.

El histórico anterior sigue en la base suspendida de Floot. No recargar ni comprar para recuperarlo: hace falta una exportación legítima del ledger original. No inventar registros ni entradas a partir de capturas/precios actuales.

Desde la corrección de puntualidad, `state/head.json` apunta al SHA inmutable ya publicado tras conservar las entregas. El Site comprueba la referencia cada minuto sin API REST de GitHub. Las fechas de decisiones y la revisión cifrada siguen controlando la vigencia; una referencia accesible no acredita una decisión reciente.

Los avisos usan el cierre del intervalo efectivo de cinco minutos como fecha límite, sin fingir un tick exacto. NEW_SIGNAL exige plan pendiente actual; ENTRY_REACHED exige plan activado actual. Una entrada de un plan terminado o un evento histórico no se envían como vigentes, y sus resultados continúan archivados. Un fallo de envío no bloquea la publicación del estado cifrado.

La pantalla de la app recibe precios XAUUSD por el hub SignalR/WebSocket gratuito mientras está visible. Valida bid/ask/mid, fecha, símbolo y secuencia; reconecta y vuelve a suscribirse. Si se interrumpe, muestra la consulta de respaldo de 60 segundos, con control de caducidad. Esto no modifica el motor ni implica ejecución tick a tick. `runner/stream-probe.cjs` verifica integración tras cambios de código sin modificar decisiones ni guardar ticks sin cifrar.

Activación pendiente del programador externo: [instrucciones gratuitas cada cinco minutos](notes/free-scheduler-setup.md).
