/**
 * Notification Domain Errors
 *
 * Excepciones personalizadas para el sistema de notificaciones.
 *
 * HUMAN REVIEW: Estos errores no deben bloquear el flujo principal
 * de triaje, pero deben ser registrados para garantizar que el personal
 * médico reciba las notificaciones críticas.
 */

/**
 * Error cuando falla el envío de una notificación
 */
export class NotificationSendError extends Error {
  public readonly code = 'NOTIFICATION_SEND_ERROR';
  public readonly notificationType: string;

  constructor(notificationType: string, message: string, public readonly cause?: Error) {
    super(`Failed to send ${notificationType} notification: ${message}`);
    this.name = 'NotificationSendError';
    this.notificationType = notificationType;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotificationSendError);
    }
  }
}

/**
 * Error cuando el servicio de mensajería no está disponible
 */
export class MessagingServiceUnavailableError extends Error {
  public readonly code = 'MESSAGING_SERVICE_UNAVAILABLE';

  constructor(message: string) {
    super(`Messaging service unavailable: ${message}`);
    this.name = 'MessagingServiceUnavailableError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MessagingServiceUnavailableError);
    }
  }
}

/**
 * Error cuando faltan datos requeridos para la notificación
 */
export class InvalidNotificationDataError extends Error {
  public readonly code = 'INVALID_NOTIFICATION_DATA';
  public readonly missingFields: string[];

  constructor(messageOrFields: string | string[]) {
    const fields = Array.isArray(messageOrFields) ? messageOrFields : [messageOrFields];
    super(Array.isArray(messageOrFields)
      ? `Invalid notification data: Missing fields: ${messageOrFields.join(', ')}`
      : messageOrFields
    );
    this.name = 'InvalidNotificationDataError';
    this.missingFields = fields;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidNotificationDataError);
    }
  }
}

