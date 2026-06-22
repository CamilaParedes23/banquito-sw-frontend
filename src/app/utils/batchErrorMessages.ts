export const UNKNOWN_ERROR_MESSAGE = 'Error desconocido.';

const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_MASS_PAYMENTS_ACCOUNT_NOT_ENABLED: 'La cuenta de cargo no esta habilitada como matriz para pagos masivos.',
  ACCOUNT_NOT_FOUND: 'No se encontro la cuenta indicada.',
  ACCOUNT_INACTIVE: 'La cuenta indicada no se encuentra activa.',
  ACCOUNT_CUSTOMER_MISMATCH: 'La cuenta indicada no pertenece a la empresa.',
  AUTH_SCOPE_DENIED: 'No existe autorizacion tecnica suficiente para completar la operacion.',
  COMPANY_CUSTOMER_RESOLUTION_FAILED: 'No fue posible verificar la empresa en Core.',
  COMPANY_INACTIVE: 'La empresa no se encuentra activa en Core.',
  COMPANY_NOT_FOUND: 'No se encontro la empresa en Core.',
  COMPANY_RUC_MISMATCH: 'El RUC del archivo no coincide con la empresa autenticada.',
  CORE_REJECTED: 'Core rechazo la operacion.',
  DUPLICATE_BATCH: 'Este lote ya fue recibido y no puede reprocesarse.',
  DUPLICATE_SEQUENCE: 'Hay lineas con numero de secuencia duplicado.',
  FOOTER_AMOUNT_MISMATCH: 'La suma de los pagos no coincide con el monto declarado en el pie de control.',
  FOOTER_COUNT_MISMATCH: 'La cantidad de lineas no coincide con el pie de control.',
  HEADER_AMOUNT_MISMATCH: 'La suma de los pagos no coincide con el monto declarado en la cabecera.',
  HEADER_COUNT_MISMATCH: 'La cantidad de lineas no coincide con la cabecera.',
  INSUFFICIENT_FUNDS: 'La cuenta no tiene fondos suficientes para cubrir el lote.',
  INVALID_AMOUNT: 'El monto de cada pago debe ser mayor a cero.',
  INVALID_NOTIFICATION_EMAIL: 'El correo de notificacion es obligatorio y debe tener un formato valido.',
  INVALID_ROUTING_CODE: 'La institucion financiera de destino no existe en el catalogo.',
  MASS_PAYMENTS_DISABLED: 'La empresa no tiene habilitado el servicio de pagos masivos.',
  MISSING_FIELD: 'Hay campos obligatorios vacios en el archivo.',
  MISSING_SECURITY_HASH: 'El hash o codigo de seguridad del archivo es obligatorio.',
  RESERVATION_AMOUNT_EXCEEDS_AVAILABLE_BALANCE: 'La cuenta no tiene saldo disponible suficiente para reservar el monto del lote.',
  RESOURCE_NOT_FOUND: 'No se encontro la informacion requerida para procesar el lote.',
  SOURCE_ACCOUNT_INACTIVE: 'La cuenta matriz no se encuentra activa.',
  SOURCE_ACCOUNT_INSUFFICIENT_FUNDS: 'La cuenta matriz no cubre el monto total del lote.',
  SOURCE_ACCOUNT_NOT_ELIGIBLE: 'La cuenta informada no esta habilitada como cuenta matriz de pagos masivos.',
  SOURCE_ACCOUNT_NOT_FOUND: 'No se encontro la cuenta matriz indicada.',
  SOURCE_ACCOUNT_NOT_OWNED_BY_COMPANY: 'La cuenta matriz no pertenece a la empresa autenticada.',
  SOURCE_ACCOUNT_VALIDATION_FAILED: 'No fue posible validar la empresa y la cuenta matriz en Core.',
  VALIDATION_ERROR: 'El lote contiene datos invalidos.',
};

const MESSAGE_PATTERNS: Array<[RegExp, string]> = [
  [/ADMIN_INSTITUTION_NOT_FOUND/i, 'La institucion financiera de destino no existe en el catalogo.'],
  [/instituci[o\u00f3]n financiera no encontrada/i, 'La institucion financiera de destino no existe en el catalogo.'],
  [/company-account-validation/i, 'No fue posible validar la empresa y la cuenta matriz en Core.'],
  [/saldo|fondos insuficientes|available balance/i, 'La cuenta no tiene fondos suficientes para cubrir el lote.'],
  [/timeout|connection refused|no disponible/i, 'Un servicio requerido no estuvo disponible para completar la validacion.'],
];

type CoreErrorBody = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

export function getMappedErrorMessage(code?: string | null): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[normalizeCode(code)] ?? null;
}

export function mapValidationErrorMessage(code?: string | null, fallback?: string | null): string {
  const mappedCode = getMappedErrorMessage(code);
  if (mappedCode) return mappedCode;

  const nestedCode = extractCoreErrorCode(fallback);
  const mappedNestedCode = getMappedErrorMessage(nestedCode);
  if (mappedNestedCode) return mappedNestedCode;

  return mapMessageByPattern(fallback) ?? UNKNOWN_ERROR_MESSAGE;
}

export function mapBatchRejectionMessage(rawMessage?: string | null): string {
  if (!rawMessage) return UNKNOWN_ERROR_MESSAGE;

  const nestedCode = extractCoreErrorCode(rawMessage);
  const mappedNestedCode = getMappedErrorMessage(nestedCode);
  if (mappedNestedCode) return mappedNestedCode;

  const leadingCode = extractLeadingCode(rawMessage);
  const mappedLeadingCode = getMappedErrorMessage(leadingCode);
  if (mappedLeadingCode) return mappedLeadingCode;

  return mapMessageByPattern(rawMessage) ?? UNKNOWN_ERROR_MESSAGE;
}

export function getDisplayErrorCode(code?: string | null, fallback?: string | null): string {
  const normalizedCode = normalizeCode(code);
  if (normalizedCode && getMappedErrorMessage(normalizedCode)) return normalizedCode;

  const nestedCode = normalizeCode(extractCoreErrorCode(fallback));
  if (nestedCode && getMappedErrorMessage(nestedCode)) return nestedCode;

  return 'ERROR_DESCONOCIDO';
}

export function getFriendlyFieldName(field?: string | null): string | null {
  if (!field) return null;

  const cleanField = field.replace(/^line\[[^\]]+\]\./, '');
  const fieldNames: Record<string, string> = {
    amount: 'Monto',
    beneficiaryIdentification: 'Identificacion del beneficiario',
    beneficiaryName: 'Nombre del beneficiario',
    destinationAccountNumber: 'Cuenta destino',
    fileHash: 'Archivo',
    footerControlAmount: 'Monto del pie de control',
    footerTotalRecords: 'Cantidad del pie de control',
    headerControlAmount: 'Monto de cabecera',
    headerTotalRecords: 'Cantidad de cabecera',
    notificationEmail: 'Correo de notificacion',
    routingCode: 'Institucion financiera',
    securityHash: 'Codigo de seguridad',
    sequenceNumber: 'Secuencia',
  };

  return fieldNames[cleanField] ?? cleanField;
}

function extractLeadingCode(message?: string | null): string | null {
  if (!message) return null;
  const match = message.match(/^\s*([A-Z0-9_]+)\s*:/);
  return match?.[1] ?? null;
}

function extractCoreErrorCode(message?: string | null): string | null {
  const body = extractCoreErrorBody(message);
  return typeof body?.code === 'string' ? body.code : null;
}

function extractCoreErrorBody(message?: string | null): CoreErrorBody | null {
  if (!message) return null;

  const firstBrace = message.indexOf('{');
  const lastBrace = message.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(message.slice(firstBrace, lastBrace + 1)) as CoreErrorBody;
  } catch {
    return null;
  }
}

function mapMessageByPattern(message?: string | null): string | null {
  if (!message) return null;
  const match = MESSAGE_PATTERNS.find(([pattern]) => pattern.test(message));
  return match?.[1] ?? null;
}

function normalizeCode(code?: string | null): string {
  return (code ?? '').trim().toUpperCase();
}
