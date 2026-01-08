/**
 * Triage Event Bus - Domain Layer
 *
 * Implementación del patrón Observable para eventos de triage.
 * Permite registrar múltiples observers y notificarlos cuando ocurren eventos.
 *
 * SOLID Principles:
 * - SRP: Solo responsable de gestionar suscripciones y notificaciones
 * - OCP: Abierto para extensión (agregar observers), cerrado para modificación
 * - DIP: Depende de interfaces (IObserver), no de implementaciones concretas
 */

import { IObservable, IObserver } from './IObserver';
import { TriageEvent } from './TriageEvents';
import { Logger } from '@shared/Logger';

/**
 * Event Bus para eventos de triage
 *
 * HUMAN REVIEW: Esta es la implementación concreta del patrón Observer
 * para el sistema de triage. Los observers se registran aquí y son
 * notificados cuando ocurre un evento.
 */
export class TriageEventBus implements IObservable<TriageEvent> {
  private observers: IObserver<TriageEvent>[] = [];
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Registra un observer para recibir notificaciones
   */
  subscribe(observer: IObserver<TriageEvent>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      this.logger.info('Observer subscribed', {
        observerType: observer.constructor.name,
        totalObservers: this.observers.length
      });
    }
  }

  /**
   * Alias for subscribe (IObservable interface)
   */
  attach(observer: IObserver<TriageEvent>): void {
    this.subscribe(observer);
  }

  /**
   * Elimina un observer de la lista de notificaciones
   */
  unsubscribe(observer: IObserver<TriageEvent>): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
      this.logger.info('Observer unsubscribed', {
        observerType: observer.constructor.name,
        totalObservers: this.observers.length
      });
    }
  }

  /**
   * Alias for unsubscribe (IObservable interface)
   */
  detach(observer: IObserver<TriageEvent>): void {
    this.unsubscribe(observer);
  }

  /**
   * Notifica a todos los observers registrados sobre un evento
   *
   * HUMAN REVIEW: Las notificaciones se ejecutan secuencialmente.
   * En producción, considerar ejecutarlas en paralelo con Promise.all()
   * o en background con una cola de mensajes para no bloquear el flujo principal.
   */
  async notify(event: TriageEvent): Promise<void> {
    this.logger.info('Notifying observers', {
      eventType: event.eventType,
      patientId: event.patientId,
      observerCount: this.observers.length
    });

    for (const observer of this.observers) {
      try {
        await observer.update(event);
      } catch (error) {
        // HUMAN REVIEW: NO fallar la notificación completa si un observer falla
        // Registrar el error y continuar con los demás observers
        this.logger.error(`Observer notification failed - Observer: ${observer.constructor.name}, Event: ${event.eventType}, Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Retorna el número de observers registrados
   * Útil para testing y debugging
   */
  getObserverCount(): number {
    return this.observers.length;
  }
}
