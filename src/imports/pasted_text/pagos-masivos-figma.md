# PROMPT FIGMA — INTERFACES SWITCH DE PAGOS MASIVOS · BanQuito

---

## CONTEXTO DEL SISTEMA

Diseña un conjunto de pantallas para el **Portal de Pagos Masivos de BanQuito**, un sistema utilizado por dos tipos de usuarios:

- **Cliente Empresarial (empresa):** carga lotes de pagos de nómina o proveedores, hace seguimiento y descarga comprobantes
- **Operador Bancario (back-office):** revisa, aprueba o rechaza lotes antes de que se procesen

El sistema recibe archivos de pago, los valida, orquesta el procesamiento contra el Core Bancario y entrega reportes de resultado.

> ⚠️ **Restricción del proyecto:** El sistema NO usa el concepto de "cuenta favorita" para SFTP. La cuenta matriz de la empresa siempre debe seleccionarse explícitamente al subir un lote.

**Estilo visual:**
- Design system: corporativo empresarial, transmite seguridad y control de procesos
- Paleta principal: verde oscuro `#1E5631` (encabezados/acciones primarias), verde medio `#2E7D32` (botones de acción positiva), rojo `#C62828` (rechazo/error), amarillo `#F9A825` (advertencias), blanco y gris `#F5F7FA` (fondos)
- Tipografía: Inter o Roboto; énfasis en datos numéricos (montos grandes y claros)
- Componentes clave: stepper de flujo de lote, badges de estado (RECIBIDO · VALIDANDO · APROBADO · PROCESANDO · LIQUIDANDO · FINALIZADO · RECHAZADO · CANCELADO), tablas con filtros, progress bars de progreso
- Tono: denso en información, orientado a procesos por pasos, claro en estados y errores

**Flujo principal del lote:** Empresa carga archivo → Sistema valida → Banco aprueba → Sistema procesa → Sistema liquida → Empresa descarga novedades y comprobante

---

## PANTALLAS A DISEÑAR

Diseña las siguientes **10 pantallas** en Figma como frames de escritorio (1440 × 900 px). Incluir en cada frame una anotación (texto en rojo fuera del frame o en capa de notas) con los servicios REST que consume.

---

### PANTALLA 1 — Dashboard de Pagos Masivos (Vista Empresa)

**Descripción:** Panel principal del cliente empresarial con resumen de sus lotes y accesos rápidos.

**Elementos UI:**
- Header: logo BanQuito · nombre empresa · RUC · usuario en sesión
- Cards de resumen: Lotes enviados este mes · Total dispersado este mes · Lotes pendientes de aprobación · Lotes en procesamiento
- Tabla "Mis últimos lotes": columnas → UUID (últimos 8 chars) · Tipo (Nómina/Proveedores) · Fecha envío · Total beneficiarios · Monto total · Estado (badge con color) · Acciones (Ver detalle)
- Botón principal flotante: "Cargar Nuevo Lote" (verde, prominente)
- Alerta informativa si hay lotes pendientes de aprobación: banner amarillo "Tienes X lotes esperando aprobación del banco"

**Servicios REST que consume:**
```
GET  /api/v1/pagos-masivos/lotes                          → tabla de lotes de la empresa (filtrado por RUC en sesión)
GET  /api/v1/config/horarios-corte                        → para mostrar "Horario de corte hoy: 18:00"
```

---

### PANTALLA 2 — Carga de Nuevo Lote

**Descripción:** Flujo de carga de archivo de pagos masivos en dos pasos.

**Elementos UI:**
- Stepper superior: Paso 1 "Datos del lote" → Paso 2 "Carga de archivo" → Paso 3 "Confirmación"

**Paso 1 — Datos del lote:**
- Selector tipo de pago: radio button "Nómina" / "Proveedores"
- Dropdown: Cuenta Matriz (cuenta de la empresa desde la que se debitará el lote)
- Campo informativo (solo lectura): "Saldo disponible en cuenta seleccionada: $X,XXX.XX"
- Banner de horario: "Hora límite de carga para hoy: 18:00. Hora actual: HH:MM" con semáforo visual (verde/amarillo/rojo)

**Paso 2 — Carga del archivo:**
- Zona de drag & drop para el archivo (formatos aceptados: .txt, .csv)
- Muestra nombre del archivo, tamaño y hash SHA-256 calculado automáticamente
- Botón "Seleccionar archivo" como alternativa al drag & drop

**Paso 3 — Confirmación:**
- Resumen: tipo de pago · cuenta matriz · nombre del archivo · hash · número de líneas detectadas · monto total detectado en cabecera
- Checkbox: "Confirmo que el archivo es correcto y autorizo su procesamiento"
- Botones: "Atrás" · "Enviar Lote"
- Modal de éxito: UUID del lote generado · estado RECIBIDO · "El banco revisará tu lote en las próximas horas"

**Servicios REST que consume:**
```
GET  /api/v1/clientes/{identificacion}/cuentas            → carga las cuentas matriz disponibles de la empresa
GET  /api/v1/cuentas/{numero}/saldos                      → muestra saldo disponible de la cuenta seleccionada
GET  /api/v1/config/horarios-corte                        → muestra y valida el horario de corte en tiempo real
POST /api/v1/pagos-masivos/lotes                          → envía el archivo y datos al confirmar
```

---

### PANTALLA 3 — Historial de Lotes (Vista Empresa)

**Descripción:** Listado completo y filtrable de todos los lotes enviados por la empresa.

**Elementos UI:**
- Barra de filtros: Tipo de pago (Todos/Nómina/Proveedores) · Estado · Fecha Desde · Fecha Hasta · Botón "Buscar"
- Tabla de resultados con columnas: UUID · Tipo · Fecha de envío · Fecha de proceso · Beneficiarios · Monto total · Costo servicio · Estado (badge)
- Cada fila es clickeable y lleva al Detalle del Lote (Pantalla 5)
- Botón por fila en columna Acciones: "Ver detalle" y, si aplica, "Cancelar" (solo si estado = RECIBIDO o VALIDANDO)
- Paginación inferior
- Totales al pie: suma de montos dispersados en el período filtrado

**Servicios REST que consume:**
```
GET    /api/v1/pagos-masivos/lotes                        → carga la tabla con filtros aplicados y paginación
DELETE /api/v1/pagos-masivos/lotes/{uuid}                 → botón "Cancelar" en filas elegibles
```

---

### PANTALLA 4 — Panel de Aprobación (Vista Operador Bancario)

**Descripción:** Cola de trabajo del operador bancario para aprobar o rechazar lotes pendientes.

**Elementos UI:**
- Header diferenciado: badge "OPERADOR BANCARIO" en lugar del nombre de empresa
- Tabla "Lotes pendientes de aprobación": columnas → UUID · Empresa (RUC + nombre) · Tipo · Fecha envío · Beneficiarios · Monto total · Tiempo en cola
- Por cada fila: botones de acción inline "Revisar y Aprobar" (verde) · "Rechazar" (rojo)
- Filtros: por empresa, por tipo de pago, por rango de monto
- Badge contador en header: "X lotes pendientes"
- Si la tabla está vacía: estado vacío ilustrado con mensaje "No hay lotes pendientes de aprobación"

**Servicios REST que consume:**
```
GET  /api/v1/pagos-masivos/lotes                          → filtrado por estado=VALIDADO (pendientes de aprobación)
```

---

### PANTALLA 5 — Detalle del Lote con Revisión Línea a Línea

**Descripción:** Vista completa de un lote, usada tanto por la empresa (para seguimiento) como por el operador (para revisión antes de aprobar/rechazar).

**Elementos UI:**
- Header del lote: UUID · Estado (badge grande) · empresa · tipo · fecha envío
- Stepper horizontal del flujo del lote: RECIBIDO → VALIDANDO → APROBADO → PROCESANDO → LIQUIDANDO → FINALIZADO (con el paso actual resaltado)
- Cards de resumen: Total beneficiarios · Monto total · Líneas exitosas · Líneas rechazadas
- **Si el usuario es OPERADOR:** Sección de acción superior con botones "Aprobar Lote" y "Rechazar Lote" + campo "Comentario del operador"
- Tabla "Detalle línea a línea": columnas → N° línea · Nombre beneficiario · Cuenta destino · Banco destino · Monto · Estado (Exitoso/Rechazado/Pendiente) · Motivo rechazo
- Filtro sobre la tabla: "Mostrar solo: Todas / Exitosas / Rechazadas / Pendientes"
- Barra de progreso si estado = PROCESANDO: "Procesando línea 1,234 de 5,000 (24%)"

**Servicios REST que consume:**
```
GET  /api/v1/pagos-masivos/lotes/{uuid}/estado            → estado actual y progreso del lote
GET  /api/v1/pagos-masivos/lotes/{uuid}/detalle           → tabla línea a línea del lote
POST /api/v1/pagos-masivos/lotes/{uuid}/aprobar           → botón "Aprobar" (solo vista operador)
POST /api/v1/pagos-masivos/lotes/{uuid}/rechazar          → botón "Rechazar" (solo vista operador)
```

---

### PANTALLA 6 — Modal de Aprobación

**Descripción:** Modal de confirmación que aparece al presionar "Aprobar Lote" desde la Pantalla 5.

**Elementos UI:**
- Título: "Confirmar Aprobación del Lote"
- Resumen: UUID del lote · empresa · monto total · número de beneficiarios
- Campo: "Comentario (opcional)"
- Campo: "Usuario autorizador" (pre-rellenado con el operador en sesión, no editable)
- Alerta verde: "Al aprobar, el sistema iniciará el procesamiento automáticamente."
- Botones: "Cancelar" · "Confirmar Aprobación"
- Resultado: toast de éxito "Lote aprobado. El procesamiento iniciará en breve."

**Servicios REST que consume:**
```
POST /api/v1/pagos-masivos/lotes/{uuid}/aprobar           → acción del botón "Confirmar Aprobación"
```

---

### PANTALLA 7 — Modal de Rechazo

**Descripción:** Modal de confirmación que aparece al presionar "Rechazar Lote".

**Elementos UI:**
- Título: "Rechazar Lote"
- Resumen: UUID · empresa · monto total
- Campo obligatorio: "Motivo del rechazo" (textarea, mínimo 20 caracteres)
- Alerta roja: "El lote será cancelado y se liberará cualquier bloqueo de saldo. La empresa será notificada."
- Botones: "Cancelar" · "Confirmar Rechazo" (rojo)
- Resultado: toast con fondo rojo "Lote rechazado. Se ha notificado a la empresa."

**Servicios REST que consume:**
```
POST /api/v1/pagos-masivos/lotes/{uuid}/rechazar          → acción del botón "Confirmar Rechazo"
```

---

### PANTALLA 8 — Reporte de Novedades

**Descripción:** Pantalla de resultados finales del lote mostrando el detalle de éxitos y rechazos.

**Elementos UI:**
- Header: UUID · empresa · fecha de procesamiento · estado FINALIZADO
- Tarjetas de resumen en colores: verde "Líneas exitosas: X ($XXX,XXX.XX)" · rojo "Líneas rechazadas: X ($XXX.XX)" · total "Total procesado"
- Gráfico de dona simple: proporción exitosas vs rechazadas (si aplica, puede ser solo una barra horizontal)
- Tabla de novedades: columnas → N° línea · Beneficiario · Cuenta · Monto · Estado · Motivo de rechazo
- Filtro: "Ver solo rechazadas"
- Botón: "Descargar archivo de novedades (.csv)" prominente en el header

**Servicios REST que consume:**
```
GET  /api/v1/pagos-masivos/lotes/{uuid}/novedades         → datos completos del reporte de novedades
```

---

### PANTALLA 9 — Comprobante de Liquidación Corporativa

**Descripción:** Documento digital oficial del lote con el resumen financiero completo.

**Elementos UI:**
- Diseño tipo "documento" con bordes y logo BanQuito en el header
- Número de comprobante · Fecha de emisión · UUID del lote
- Sección Empresa: RUC · Razón Social · Cuenta Matriz debitada
- Sección Resumen Financiero:
  - Monto total dispersado a beneficiarios
  - Costo del servicio (comisión escalonada)
  - IVA retenido (12%)
  - **Total debitado de cuenta matriz** (suma de los anteriores, en negrita grande)
- Sección Detalle de Comisión: tabla con rangos y tarifa unitaria aplicada
- Pie: leyenda legal, firma digital (placeholder), sello BanQuito
- Botón flotante fuera del documento: "Descargar PDF" · "Imprimir"

**Servicios REST que consume:**
```
GET  /api/v1/pagos-masivos/lotes/{uuid}/comprobante       → todos los datos financieros del comprobante
GET  /api/v1/config/esquema-tarifario                     → detalle de la tarifa aplicada (sección comisión)
```

---

### PANTALLA 10 — Configuración del Sistema (Vista Administrador)

**Descripción:** Panel de consulta de parámetros operativos del Switch.

**Elementos UI:**
- Tabs: "Esquema Tarifario" | "Horarios de Corte"

**Tab Esquema Tarifario:**
- Tabla con columnas: Rango Desde · Rango Hasta · Tarifa Unitaria · Vigencia desde
- Badge "VIGENTE" en la tarifa activa actual
- Banner informativo: "Para modificar tarifas, contacte al área de Productos Bancarios"

**Tab Horarios de Corte:**
- Tabla con columnas: Tipo de Pago · Día de la semana · Hora de corte · Zona horaria
- Semáforo visual por fila: verde (corte no alcanzado hoy) / rojo (corte ya pasó hoy)
- Banner informativo similar al de tarifas

**Servicios REST que consume:**
```
GET  /api/v1/config/esquema-tarifario                     → datos del tab Esquema Tarifario
GET  /api/v1/config/horarios-corte                        → datos del tab Horarios de Corte
```

---

## ENTREGABLES ESPERADOS EN FIGMA

1. **10 frames de 1440 × 900 px** organizados en un page llamado `Switch de Pagos Masivos`
2. **Dos variantes del sidebar/header** según el rol: "Empresa" (verde claro, con nombre y RUC de empresa) y "Operador Bancario" (verde oscuro, con badge de rol)
3. En cada frame, incluir una **anotación de servicios REST** fuera del área del frame (texto en rojo `#C62828`) listando método HTTP + ruta de cada endpoint que esa pantalla consume
4. El **stepper de estados del lote** debe ser un componente reutilizable consistente en las Pantallas 3, 4 y 5
5. Los modales de Aprobación y Rechazo (Pantallas 6 y 7) pueden diseñarse sobre el fondo de la Pantalla 5 con un overlay semitransparente
6. Diseñar al menos una variante de estado vacío (cuando no hay lotes) para el Dashboard y el Panel de Aprobación

---

## RELACIÓN COMPLETA INTERFACES → SERVICIOS REST

| Pantalla | Rol | Servicio REST consumido |
|---|---|---|
| 1. Dashboard | Empresa | `GET /api/v1/pagos-masivos/lotes` · `GET /api/v1/config/horarios-corte` |
| 2. Carga de Lote | Empresa | `GET /api/v1/clientes/{id}/cuentas` · `GET /api/v1/cuentas/{numero}/saldos` · `GET /api/v1/config/horarios-corte` · `POST /api/v1/pagos-masivos/lotes` |
| 3. Historial de Lotes | Empresa | `GET /api/v1/pagos-masivos/lotes` · `DELETE /api/v1/pagos-masivos/lotes/{uuid}` |
| 4. Panel de Aprobación | Operador | `GET /api/v1/pagos-masivos/lotes` |
| 5. Detalle del Lote | Empresa / Operador | `GET /api/v1/pagos-masivos/lotes/{uuid}/estado` · `GET /api/v1/pagos-masivos/lotes/{uuid}/detalle` · `POST /api/v1/pagos-masivos/lotes/{uuid}/aprobar` · `POST /api/v1/pagos-masivos/lotes/{uuid}/rechazar` |
| 6. Modal Aprobación | Operador | `POST /api/v1/pagos-masivos/lotes/{uuid}/aprobar` |
| 7. Modal Rechazo | Operador | `POST /api/v1/pagos-masivos/lotes/{uuid}/rechazar` |
| 8. Reporte Novedades | Empresa | `GET /api/v1/pagos-masivos/lotes/{uuid}/novedades` |
| 9. Comprobante | Empresa | `GET /api/v1/pagos-masivos/lotes/{uuid}/comprobante` · `GET /api/v1/config/esquema-tarifario` |
| 10. Configuración | Administrador | `GET /api/v1/config/esquema-tarifario` · `GET /api/v1/config/horarios-corte` |
