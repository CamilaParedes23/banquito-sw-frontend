export type UserRole = 'EMPRESA' | 'OPERADOR' | 'AUDITOR' | 'ADMIN';



export type BatchStatus =

  | 'RECIBIDO'

  | 'VALIDANDO'

  | 'VALIDADO'

  | 'RECHAZADO'

  | 'ENCOLADO'

  | 'PROCESANDO'

  | 'PROCESADO_PARCIAL'

  | 'PROCESADO_TOTAL'

  | 'FALLIDO'

  | 'CERRADO'

  | 'ANULADO';



export type ServiceType = 'NOM' | 'PRV';



export type Channel = 'PORTAL_WEB' | 'SFTP';



export type LineStatus = 'PENDIENTE' | 'EXITOSA' | 'RECHAZADA' | 'FALLIDA';



export type NotificationStatus = 'PENDIENTE' | 'ENVIADA' | 'ERROR' | 'CANCELADA';



export type NotificationType = 'PAGO_EXITOSO' | 'PAGO_RECHAZADO';



export type SettlementStatus = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO';



export interface User {

  id: string;

  username: string;

  role: UserRole;

  companyName?: string;

  companyRuc?: string;

  email: string;

}



export interface Batch {

  id: string;

  fileName: string;

  fileHash: string;

  serviceType: ServiceType;

  channel: Channel;

  companyRuc: string;

  companyName: string;

  accountNumber: string;

  declaredTotal: number;

  validatedTotal?: number;

  totalRecords: number;

  successfulRecords?: number;

  rejectedRecords?: number;

  status: BatchStatus;

  receptionDate: string;

  processingDate?: string;

  closingDate?: string;

  rejectionReason?: string;

  scheduledDate?: string;

  processedLines?: number;

}



export interface PaymentLine {

  id: string;

  batchId: string;

  lineNumber: number;

  beneficiaryName: string;

  beneficiaryId: string;

  destinationAccount: string;

  destinationBank: string;

  amount: number;

  status: LineStatus;

  errorCode?: string;

  errorMessage?: string;

  switchUuid?: string;

  debitUuid?: string;

  creditUuid?: string;

  processedDate?: string;

}



export interface ServiceTypeConfig {

  codigo: string;

  nombre: string;

  descripcion: string;

  estado: string;

}



