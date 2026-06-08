# Prompt: Diseño de Interfaces — Switch de Pagos Masivos BanQuito

## Contexto del sistema

Eres un diseñador/desarrollador UI senior. Debes crear las interfaces web del **Switch de Pagos Masivos de Banco BanQuito**, sistema que orquesta la dispersión masiva de pagos corporativos (nóminas y proveedores). Opera sobre PostgreSQL y se comunica con el Core Bancario (sistema separado en MariaDB) sin acceso directo a su base de datos.

El Switch tiene **dos tipos de usuarios**: las **Empresas Clientes** (CFOs y tesoreros que cargan archivos y consultan resultados) y los **Operadores del banco** (Back-Office que monitorea, aprueba y administra el sistema). Las interfaces deben adaptarse claramente a cada perfil.

---

## Stack y convenciones técnicas

- **Framework**: React (TypeScript) u otro SPA moderno.
- **Autenticación**: JWT obtenido desde el Core (`POST /api/v1/core/auth/login`). Propagado en `Authorization: Bearer {token}`.
- **Trazabilidad**: Header `X-Correlation-Id` en todas las peticiones para correlacionar flujos Switch → Core → SMTP.
- **Idempotencia**: Operaciones de liquidación requieren header `Idempotency-Key`.
- **Paginación**: `?page=0&size=20&sort=campo,desc`.
- **Moneda**: USD, siempre `NUMERIC(19,4)`, mostrar con 2 decimales y símbolo `$`.
- **Base URL Switch**: `/api/v1/switch`
- **Respuestas**: JSON con estructura `{ data, meta, errors, correlationId }`.
- **Errores relevantes**: 400 (validación), 401 (no autenticado), 403 (sin permiso), 409 (duplicidad de archivo/hash), 422 (regla de negocio: RUC inactivo, saldo insuficiente, fuera de horario), 500.

---

## Roles de usuario

| Rol | Perfil | Acceso |
|-----|--------|--------|
| `EMPRESA` | Cliente corporativo (CFO / Tesorero) | Cargar lotes, confirmar, consultar estado, historial, descargar reportes |
| `OPERADOR` | Back-Office banco | Todo lo anterior + ver cola, reprocesar líneas, gestionar notificaciones, administrar catálogos |
| `AUDITOR` | Cumplimiento banco | Solo lectura: auditoría, intentos, liquidación |
| `ADMIN` | Administrador Switch | Todo lo anterior + gestionar parámetros, límites y tarifas |

---

## Flujo principal de un lote (para entender la UX)

```
Empresa carga archivo → RECIBIDO
  → Sistema valida → VALIDANDO → VALIDADO (o RECHAZADO)
    → Empresa confirma → Sistema procesa → PROCESANDO
      → PROCESADO_PARCIAL o PROCESADO_TOTAL
        → Sistema liquida comisión e IVA
          → CERRADO (reportes disponibles)

Si se recibe fuera de horario (después de 18:00) o en feriado:
  → Estado: ENCOLADO → procesa automáticamente a las 00:01 día hábil siguiente
```

Cada transición de estado debe reflejarse claramente en la UI mediante badges de color y un historial de estados accesible.

---

## Módulos e interfaces requeridas

---

### MÓDULO 1 — Dashboard Principal

**Pantalla 1.1 — Dashboard resumen**
- Endpoint: `GET /api/v1/switch/dashboard/resumen`
- Vista diferenciada por rol:
  - **EMPRESA**: Sus propios lotes del día/semana, monto dispersado, comisiones cobradas, lotes pendientes de confirmación.
  - **OPERADOR / ADMIN**: Totales del sistema — lotes procesados, encolados, rechazados, monto total dispersado, comisiones generadas, alertas de lotes fallidos.
- Tarjetas de KPIs con indicadores de color (verde: exitoso, amarillo: encolado/procesando, rojo: rechazado/fallido).
- Gráfico de barras: lotes procesados por día (últimos 7 días).
- Acceso rápido: botón "Cargar nuevo lote" (para EMPRESA) y "Ver cola" (para OPERADOR).

---

### MÓDULO 2 — Catálogos y Configuración (OPERADOR / ADMIN)

**Pantalla 2.1 — Tipos de servicio**
- Endpoint: `GET /api/v1/switch/tipos-servicio`
- Tabla: código (NOM, PRV), nombre, descripción, estado.
- Solo lectura para OPERADOR. ADMIN puede crear/editar.

**Pantalla 2.2 — Límites de transacción**
- Endpoints: `GET /api/v1/switch/limites-transaccion` | `POST /api/v1/switch/limites-transaccion`
- Tabla: tipo de servicio, monto mínimo, monto máximo, moneda, vigente desde/hasta, estado.
- Botón "Nuevo límite" (modal). Mostrar límites vigentes vs vencidos diferenciados visualmente.
- Los límites son visibles también para EMPRESA (solo consulta, ayuda a armar archivos válidos).

**Pantalla 2.3 — Tarifas escalonadas**
- Endpoints: `GET /api/v1/switch/tarifas` | `POST /api/v1/switch/tarifas`
- Tabla escalonada: tipo de servicio, rango desde, rango hasta (NULL = "en adelante"), tarifa unitaria, vigencia.
- Formato visual tipo tabla de precios, clara para el cliente empresarial.
- Disponible para EMPRESA (solo lectura) para simular el costo antes de cargar el archivo.

**Pantalla 2.4 — Parámetros del Switch (ADMIN)**
- Endpoints: `GET /api/v1/switch/parametros` | `PATCH /api/v1/switch/parametros/{codigo}`
- Tabla: código, valor, tipo, descripción. Editar inline con confirmación.
- Parámetros claves: `IVA_PORCENTAJE`, `HORA_CORTE_PROCESO`, `HORA_INICIO_LOTES_ENCOLADOS`, `VENTANA_DUPLICIDAD_DIAS`, `MAX_REINTENTOS_LOTE`.

---

### MÓDULO 3 — Gestión de Lotes

**Pantalla 3.1 — Historial de lotes**
- Endpoint: `GET /api/v1/switch/lotes`
- Filtros: empresa (RUC), estado, tipo de pago (NOM/PRV), canal (PORTAL_WEB/SFTP), fecha desde/hasta.
- Para EMPRESA: solo ve sus propios lotes (filtrar automáticamente por `rucEmpresa`).
- Tabla: ID lote, nombre archivo, tipo servicio, canal, total declarado, registros, estado (badge de color), fecha recepción.
- Clic en fila navega al detalle del lote.

**Estados y colores de badge:**
| Estado | Color |
|--------|-------|
| RECIBIDO | Gris |
| VALIDANDO | Azul claro |
| VALIDADO | Azul |
| RECHAZADO | Rojo |
| ENCOLADO | Naranja |
| PROCESANDO | Azul oscuro con spinner |
| PROCESADO_PARCIAL | Amarillo |
| PROCESADO_TOTAL | Verde |
| CERRADO | Verde oscuro |
| ANULADO | Gris oscuro tachado |

**Pantalla 3.2 — Cargar nuevo lote (EMPRESA)**
- Endpoint: `POST /api/v1/switch/lotes/cargar`
- Formulario multipart:
  - Selector de tipo de servicio (NOM / PRV).
  - Campo de número de cuenta matriz (validar formato).
  - Upload de archivo (CSV o TXT, máximo visible en pantalla).
  - Hash de seguridad (texto, generado por la empresa).
- Antes de enviar: mostrar advertencia si la hora actual es mayor a las 18:00 — "Su lote será encolado y procesará el siguiente día hábil a las 00:01".
- Respuesta exitosa: mostrar UUID del lote creado, estado RECIBIDO y botón para ir al detalle.

**Pantalla 3.3 — Detalle del lote**
- Endpoints: `GET /api/v1/switch/lotes/{idLote}` + `GET /api/v1/switch/lotes/{idLote}/estado`
- Panel superior: datos de cabecera (empresa, tipo servicio, canal, cuenta matriz, totales declarados vs validados).
- Badge de estado grande y visible con descripción del estado actual.
- Timeline de acciones disponibles según estado actual (ver sección de flujo de acciones más abajo).
- Tabs: Líneas de Pago | Historial de Estados | Liquidación | Reportes.

**Flujo de acciones por estado (botones que aparecen/desaparecen):**
- `VALIDADO` → Botón "Confirmar procesamiento" (EMPRESA) | Botón "Cancelar lote" (EMPRESA/OPERADOR)
- `ENCOLADO` → Solo visualización. Indicar fecha y hora programada de proceso.
- `PROCESADO_TOTAL` o `PROCESADO_PARCIAL` → Liquidación automática iniciada. Indicar progreso.
- `CERRADO` → Botones "Descargar novedades" y "Descargar comprobante".
- `RECHAZADO` → Mostrar motivo de rechazo en panel de alerta rojo.

**Pantalla 3.4 — Confirmar lote (modal)**
- Endpoint: `POST /api/v1/switch/lotes/{idLote}/confirmar`
- Resumen: monto total a dispersar, número de beneficiarios, tipo de pago.
- Advertencia: "Al confirmar, se iniciará el procesamiento y se realizarán los débitos correspondientes."
- Botón de confirmación con texto explícito: "Confirmar y procesar".

**Pantalla 3.5 — Cancelar lote (modal)**
- Endpoint: `POST /api/v1/switch/lotes/{idLote}/cancelar`
- Solo disponible antes del procesamiento.
- Campo obligatorio: motivo de cancelación.
- Advertencia si había bloqueo de saldo activo.

**Pantalla 3.6 — Historial de estados del lote**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/historial-estados`
- Timeline vertical: cada transición con estado anterior → nuevo, motivo, actor, fecha/hora.
- Mostrar dentro del tab "Historial de Estados" en el detalle del lote.

---

### MÓDULO 4 — Líneas de Pago

**Pantalla 4.1 — Listado de líneas del lote**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/lineas`
- Tabla: secuencial, beneficiario (nombre + identificación), cuenta destino, monto, estado (badge), código de error (si aplica).
- Filtros rápidos: Todas | Exitosas | Rechazadas | Pendientes.
- Contador visual: X exitosas / Y rechazadas / Z pendientes.
- Clic en fila abre detalle de línea (modal o panel lateral).

**Pantalla 4.2 — Detalle de línea (modal/panel)**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/lineas/{idLinea}`
- Mostrar: todos los campos de la línea, UUID de operación Switch, UUID débito Core, UUID crédito Core, fechas de proceso, código y mensaje de error si rechazada.
- Botón "Reprocesar" (solo para OPERADOR, solo si la línea está en estado FALLIDA y el error es recuperable).

**Pantalla 4.3 — Reprocesar línea (modal de confirmación)**
- Endpoint: `POST /api/v1/switch/lotes/{idLote}/lineas/{idLinea}/reprocesar`
- Mostrar datos de la línea a reprocesar. Advertir que generará un nuevo intento.

---

### MÓDULO 5 — Cola de Procesamiento (OPERADOR / ADMIN)

**Pantalla 5.1 — Monitor de cola**
- Endpoint: `GET /api/v1/switch/cola-procesamiento`
- Lista de lotes encolados: empresa, tipo servicio, fecha hábil programada, hora programada, prioridad, intentos realizados, estado de cola.
- Orden por: fecha programada (ascendente) y prioridad.
- Botón "Forzar procesamiento" por cada lote (con confirmación).

**Pantalla 5.2 — Forzar procesamiento de lote encolado (modal)**
- Endpoint: `POST /api/v1/switch/cola-procesamiento/{idCola}/procesar`
- Mostrar datos del lote. Advertir que se procesa fuera de la hora programada.

**Pantalla 5.3 — Intentos de procesamiento**
- Endpoint: `GET /api/v1/switch/cola-procesamiento/{idCola}/intentos`
- Timeline de intentos: número, fecha inicio/fin, estado, código de error, respuesta del Core (colapsable en JSON).

---

### MÓDULO 6 — Liquidación

**Pantalla 6.1 — Detalle de liquidación del lote**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/liquidacion`
- Mostrar dentro del tab "Liquidación" en el detalle del lote.
- Tarjeta financiera:
  - Transacciones exitosas: N
  - Tarifa unitaria aplicada: $X.XX
  - Subtotal comisión: $XX.XX
  - IVA (15%): $XX.XX
  - **Total debitado por servicios: $XX.XX**
- Detalle de movimientos contables: débito cuenta matriz, crédito a ingresos, crédito a IVA.
- Estado del débito (PENDIENTE / COMPLETADO / RECHAZADO).

---

### MÓDULO 7 — Notificaciones a Beneficiarios (OPERADOR / AUDITOR)

**Pantalla 7.1 — Listado de notificaciones**
- Endpoint: `GET /api/v1/switch/notificaciones`
- Tabla: lote, beneficiario (correo), tipo (PAGO_EXITOSO/PAGO_RECHAZADO), estado (PENDIENTE/ENVIADA/ERROR/CANCELADA), fecha envío, reintentos.
- Filtros: estado, tipo, fecha.
- Botón "Reenviar" en notificaciones con estado ERROR.

**Pantalla 7.2 — Reenviar notificación (modal)**
- Endpoint: `POST /api/v1/switch/notificaciones/{idNotificacion}/reenviar`
- Confirmar correo destino y tipo de notificación antes de reenviar.

---

### MÓDULO 8 — Reportes de Cierre

**Pantalla 8.1 — Reportes disponibles del lote**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/reportes`
- Mostrar dentro del tab "Reportes" en el detalle del lote (solo cuando estado = CERRADO).
- Dos tarjetas de reporte:
  1. **Comprobante de Liquidación Corporativa**: resumen financiero, fecha generación, formato.
  2. **Reporte de Novedades**: estado línea por línea, motivos de rechazo, fecha generación.
- Botón "Generar reportes" si aún no se han generado (OPERADOR).
- Botón "Descargar" por cada reporte disponible.
- Indicador visual si la empresa ya descargó el reporte.

**Pantalla 8.2 — Generar reportes (acción)**
- Endpoint: `POST /api/v1/switch/lotes/{idLote}/reportes/generar`
- Solo disponible para OPERADOR cuando el lote está en CERRADO y los reportes no existen aún.
- Confirmar antes de ejecutar. Mostrar spinner durante generación.

**Pantalla 8.3 — Descarga de reporte**
- Endpoint: `GET /api/v1/switch/lotes/{idLote}/reportes/{tipo}/descargar`
- Tipos: `COMPROBANTE_LIQUIDACION` o `REPORTE_NOVEDADES`.
- Disparar descarga del archivo (PDF, CSV, XLSX o JSON según formato disponible).

---

### MÓDULO 9 — Auditoría (AUDITOR / ADMIN)

**Pantalla 9.1 — Bitácora del Switch**
- Endpoint: `GET /api/v1/switch/auditoria`
- Tabla: fecha, actor (EMPRESA/USUARIO_CORE/SISTEMA/API), ID actor, RUC empresa, acción, entidad, ID entidad, IP.
- Filtros: fecha desde/hasta, tipo actor, RUC empresa, entidad.
- Solo lectura. Sin paginación agresiva (mostrar 50 por página). Exportar CSV.

---

### MÓDULO 10 — Observabilidad

**Pantalla 10.1 — Estado del Switch**
- Endpoint: `GET /api/v1/switch/health`
- Panel de salud: estado del servicio Switch, conexión PostgreSQL, integración lógica con Core, integración con SMTP.
- Visible para OPERADOR y ADMIN desde el menú.

---

## Requisitos de UX transversales

### Identidad visual
- **Paleta**: Azul marino oscuro `#0D1B4B` (institucional BanQuito) con acentos dorados `#C9A84C`. Fondo general blanco / gris muy claro `#F8F9FC`.
- **Vista EMPRESA**: Interfaz más limpia y simplificada. Solo ver sus datos. Sin acceso a configuración, cola o auditoría.
- **Vista OPERADOR/ADMIN**: Interfaz más densa con más columnas, más filtros y acciones adicionales visibles.

### Feedback visual del flujo de lote
- El badge de estado del lote debe actualizarse automáticamente (polling cada 10 segundos) cuando el lote está en estados intermedios (VALIDANDO, PROCESANDO).
- Barra de progreso de procesamiento: `{lineasProcesadas} / {totalLineas}` líneas.
- Notificación toast cuando un lote cambia a PROCESADO_TOTAL, PROCESADO_PARCIAL o RECHAZADO.

### Manejo de errores
- Error 409 en carga de archivo → "Este archivo ya fue procesado recientemente. Verifique el nombre y hash del archivo."
- Error 422 con mensaje bancario → Mostrarlo literalmente en un banner de advertencia.
- Error de conexión → Banner persistente "No se puede conectar con el servidor. Reintentando..."

### Horario de corte
- Al acceder al formulario de carga de lote, mostrar siempre: "Hora de corte para procesamiento inmediato: 18:00. Hora actual del servidor: HH:MM."
- Consultar la hora de corte desde `GET /api/v1/switch/parametros` (clave `HORA_CORTE_PROCESO`), no hardcodearla.

### Seguridad y roles
- El menú debe filtrar módulos según el rol del token JWT. EMPRESA no ve Cola, Auditoría, Parámetros ni Notificaciones.
- Las acciones destructivas (cancelar lote, reprocesar línea, forzar cola) siempre requieren confirmación en modal con texto de la acción escrito explícitamente.

### Responsive
- Mínimo 1280px para operación normal. El listado de líneas debe poder manejar lotes con miles de registros (paginación obligatoria).
- La pantalla de detalle del lote debe funcionar correctamente al imprimir (CSS print-friendly para el comprobante de liquidación).
