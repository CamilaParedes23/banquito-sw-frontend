# Reporte E2E — Banco BanQuito Switch de Pagos Masivos (Despliegue Real)

**Fecha:** 2026-06-21  
**Tester:** QA E2E automatizado (PowerShell)  
**Base URL:** `http://35.238.255.174:8000` (Kong Gateway desplegado en GCP)

---

Resumen:
- Kong Gateway responde (404 sin ruta raiz = normal).
- Core Bancario (auth, customers, accounts) funciona al 100%.
- Switch de Pagos Masivos NO esta disponible a traves de Kong. Rutas del Switch devuelven 502 Bad Gateway o 404 Not Found.
- No es posible ejecutar casos de upload de lotes, acreditacion On-Us/Off-Us, comisiones, clearing-file, duplicados ni ninguna funcionalidad del Switch hasta que el servicio Switch se publique correctamente en Kong.
- No se uso localhost ni puertos internos (8010, 8080, 8081, 8085). Todas las pruebas fueron contra la IP de despliegue real.

Base URL:
- `http://35.238.255.174:8000`

Usuarios:
- empresa: username=empresa.sierraazul / password=Password123! | actorType=CLIENTE | roles=CLIENTE_EMPRESA | scopes=core.account.balance.read | customerUuid=3f26a20e-c149-5666-84b9-7c8ce0ed2712 | massPaymentsEnabled=true | Puede operar Switch=SI
- admin: username=admin.core / password=password | actorType=EMPLEADO | roles=ADMIN_SEGURIDAD | scopes=auth.user.manage | customerUuid=(vacio) | Puede operar Switch=NO (es admin de Core)
- cliente persona: username=cliente.maria / password=Password123! | actorType=CLIENTE | roles=CLIENTE_PERSONA | scopes=core.account.balance.read,core.account.transfer.p2p | customerUuid=47e25fa5-9f81-4b7c-8afa-9dc7b8c85584 | Puede operar Switch=NO
- otros: Ninguno

Auth:
- login: 200 OK para los 3 usuarios probados. Core emite tokens JWT validos.
- /auth/me: 200 OK para los 3 usuarios. Responde actorType, roles, scopes correctos.
- refresh: No probado (endpoint POST /api/v1/auth/refresh no fue requerido en las sesiones actuales, pendiente de validar).

Matriz rutas Core:
- POST /api/v1/auth/login : 200 | Token JWT + actorType + roles + scopes
- GET /api/v1/auth/me : 200 | actorType + roles + scopes
- GET /api/v1/customers/3f26a20e-c149-5666-84b9-7c8ce0ed2712 : 200 | Datos completos de Sierra Azul, status ACTIVO, massPaymentsEnabled=true, RUC=1792103456001
- GET /api/v1/accounts/0010000010599/balance : 200 | accountingBalance=2000.00, availableBalance=2000.00
- Core esta 100% operativo.

Matriz rutas Switch:
- GET /api/v1/batches : 502 | Kong conoce la ruta pero no llega al upstream (Switch no responde)
- GET /api/v1/batches/{batchId} : 502 | Idem
- GET /api/v1/batches/{batchId}/summary : 404 | Ruta no publicada en Kong
- GET /api/v1/batches/{batchId}/lines : 502 | Kong conoce la ruta pero no llega al upstream
- GET /api/v1/batches/{batchId}/commission : 404 | Ruta no publicada
- GET /api/v1/batches/{batchId}/receipt : 404 | Ruta no publicada
- GET /api/v1/batches/{batchId}/notifications : 404 | Ruta no publicada
- GET /api/v1/batches/{batchId}/clearing-file : 404 | Ruta no publicada
- POST /api/v1/batches/upload : 502 | Kong conoce la ruta pero no llega al upstream
- GET /api/v1/switch/health : 404 | Ruta no publicada
- GET /api/v1/switch/lotes : 404 | Ruta no publicada
- GET /api/v1/switch/dashboard/resumen : 404 | Ruta no publicada
- GET /api/v1/pagos-masivos/lotes : 404 | Ruta no publicada
- GET /api/v1/core/health : 404 | Ruta no publicada

Caso On-Us:
- archivo: N/A (no se pudo ejecutar)
- batchId: N/A
- estados: N/A
- reservationUuid: N/A
- lineas: N/A
- comision: N/A
- IVA: N/A
- comprobante: N/A
- notificacion: N/A
- resultado: BLOCKED — Switch devuelve 502 en POST /api/v1/batches/upload. Imposible subir lote.

Caso mixto:
- archivo: N/A
- batchId: N/A
- estados: N/A
- On-Us: N/A
- Off-Us: N/A
- clearing-file: N/A
- comision: N/A
- IVA: N/A
- resultado: BLOCKED — Imposible ejecutar porque el upload falla con 502.

Caso invalido:
- archivo: N/A
- batchId: N/A
- errores: N/A
- reserva creada: N/A
- resultado: BLOCKED — Imposible ejecutar porque el upload falla con 502.

Caso duplicado:
- batchId: N/A
- error: N/A
- segunda reserva: N/A
- segunda comision: N/A
- resultado: BLOCKED — Imposible ejecutar porque el upload falla con 502.

Autorizacion:
- sin token: /api/v1/batches/upload devuelve 502 (ruta existe en Kong, upstream cae antes de validar auth)
- empresa: /api/v1/batches devuelve 502 (token valido, llega a Kong, upstream del Switch no responde)
- cliente persona: /api/v1/batches devuelve 502 (token valido, llega a Kong, upstream del Switch no responde)
- admin: /api/v1/batches devuelve 502 (token valido, llega a Kong, upstream del Switch no responde)
- token invalido: No probado con token invalido explicitamente (pendiente). Con UUID falso en rutas release/reverse/close da 403.
- Nota: No es posible determinar matriz de autorizacion real porque el Switch no responde. Todos los tokens autenticados llegan a Kong pero el upstream falla.

Pruebas negativas:
- release: POST /api/v1/switch-core/payment-reservations/{fake-uuid}/release = 403 | Ruta EXISTE en Kong pero requiere permisos especiales. No ejecutable por empresa.
- reverse: POST /api/v1/switch-core/payment-reservations/{fake-uuid}/reverse = 403 | Idem. No ejecutable por empresa.
- close: POST /api/v1/switch-core/payment-reservations/{fake-uuid}/close = 403 | Idem. No ejecutable por empresa.
- off-us-settlement: POST /api/v1/switch-core/payment-reservations/{fake-uuid}/off-us-settlement = 404 | Ruta NO publicada en Kong (correcto).
- core.reserve.validate: No se encontro ruta expuesta para este endpoint. No se uso en ningun flujo probado.

Errores encontrados:
- 1. Switch responde 502 en /api/v1/batches y /api/v1/batches/upload | CRITICO | Imposible subir lotes. El upstream del Switch en Kong esta caido o mal configurado.
- 2. Switch responde 404 en rutas de detalle (summary, commission, receipt, notifications, clearing-file, novelties/details) | CRITICO | Rutas del Switch no estan publicadas en Kong.
- 3. Rutas release/reverse/close estan expuestas en Kong (403) | MEDIO | Exposicion potencial de rutas internas. Requieren permisos pero deberian evaluarse si deben estar publicas.
- 4. No hay endpoint de health del Switch accesible | MEDIO | Imposible monitorear estado del Switch desde fuera.

Riesgos:
- 1. Bloqueo total del Switch: Sin resolver el 502, el sistema de pagos masivos no opera. Todo el negocio del Switch esta parado.
- 2. Rutas Core expuestas sin health check: No hay endpoint de health del Switch accesible para monitoreo.
- 3. Rutas release/reverse/close expuestas: Aunque requieren 403, su existencia puede ser riesgosa si hay bypass de permisos o escalacion de privilegios.
- 4. Fase 5-9 (upload, lotes, comisiones) no pudieron validarse: No se sabe si el procesamiento de lotes funciona correctamente.

Recomendaciones:
- 1. Verificar si el servicio Switch esta corriendo: Revisar Docker/K8s/logs del Switch en el servidor 35.238.255.174.
- 2. Verificar configuracion de Kong: Asegurar que el upstream del Switch apunte al host/puerto correcto (posiblemente servicio no levantado o puerto incorrecto).
- 3. Verificar rutas faltantes: Publicar en Kong las rutas 404 (summary, commission, receipt, clearing-file, etc.).
- 4. Revisar rutas release/reverse/close: Considerar si deben estar expuestas en Kong o solo internamente.
- 5. Re-ejecutar pruebas E2E completas (Fase 5-9) una vez resuelto el 502.
- 6. Probar token invalido para completar matriz de autorizacion.
- 7. Probar refresh token para completar fase de auth.

Reporte generado:
- DEPLOYED_CORE_R9I_SWITCH_E2E_TEST_REPORT.md en el repositorio local.

Dictamen final:
- NO LISTO PARA DESPLIEGUE FINAL.
- El Core Bancario esta operativo y los usuarios se autentican correctamente, pero el Switch de Pagos Masivos no esta disponible a traves de Kong. Toda la funcionalidad de negocio (upload de lotes, procesamiento, liquidacion, comisiones, clearing) esta bloqueada por el 502.
- Proximo paso: Resolver el 502 del Switch en Kong y re-ejecutar este reporte para validar Fase 5-9.

