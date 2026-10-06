# Comprobación del seguimiento

Fuente canónica de la app: https://libi-xau-gratis.libiliving.chatgpt.site . La app permanece privada para su propietario.

Los avisos usan `runner/push-runner.cjs`: configuración sellada al destinatario `state/push-public.json`, cuyo secreto privado solo existe dentro del estado AES-GCM con el secreto Actions existente. `state/push-config.json` contiene solo el sobre cifrado. Nunca incluir tokens del Site/Floot, endpoints de dispositivos ni claves privadas en claro.

Tras un alta/baja en Ajustes, un agente autorizado debe hacer POST owner-private `/api/push/connection`, transferir el sobre completo a `state/push-config.json` y actualizar main con expected_sha/force=false, conservando cambios concurrentes. Verificar el run por ese commit y sincronizar `/api/sync` para confirmar ids conectados y resultados. La configuración caduca a los siete días; las revisiones ya autorizadas pueden renovar el sobre. Configuración aceptada, servicio push y recepción en móvil son estados diferentes. No enviar señales anteriores a una suscripción, falsas o con más de cinco minutos. No ejecutar órdenes de broker.

El cron de Actions no garantiza 5m: hubo intervalos programados reales de 25.108 y 23.172 min. Excluir push/dispatch al medir cron. El workflow ofrece workflow_dispatch para un programador externo ya autorizado; actualmente no existe ese acceso. Un HTTP de disparo exitoso no prueba puntualidad ni recepción.

El histórico anterior sigue en la base suspendida de Floot. No recargar ni comprar para recuperarlo: hace falta una exportación legítima del ledger original. No inventar registros ni entradas a partir de capturas/precios actuales.
