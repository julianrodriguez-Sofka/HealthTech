/**
 * Observer Interface - Domain Layer
 *
 * Patrón Observer para notificaciones en el sistema de triage.
 * REQUISITO OBLIGATORIO según HU.md - Notificación automática a médicos.
 *
 * HUMAN REVIEW: Este patrón permite desacoplar la lógica de notificación
 * de la lógica de negocio. Cuando un evento ocurre (nuevo paciente, cambio
 * de prioridad), los observadores son notificados automáticamente.
 *
 * Generic Type <T>: Permite type-safe notifications con diferentes tipos de eventos
 */
export interface IObserver<T> {
  /**
   * Método llamado cuando el sujeto notifica un cambio
   *
   * @param event - Evento que disparó la notificación
   *
   * HUMAN REVIEW: Este método debe ser asíncrono en producción para
   * evitar bloquear el flujo principal cuando se envían notificaciones
   * (emails, push notifications, websockets, etc.)
   */
  update(event: T): Promise<void> | void;
}

/**
 * Subject (Observable) Interface
 *
 * Define el contrato para objetos que pueden ser observados.
 * Implementa el patrón Observer del lado del Subject.
 *
 * HUMAN REVIEW: Aplicando Open/Closed Principle - podemos agregar nuevos
 * observadores sin modificar el código del subject.
 */
export interface IObservable<T> {
  /**
   * Registra un observador para recibir notificaciones
   */
  attach(observer: IObserver<T>): void;

  /**
   * Remueve un observador de la lista de notificaciones
   */
  detach(observer: IObserver<T>): void;

  /**
   * Notifica a todos los observadores registrados
   */
  notify(event: T): Promise<void>;
}
