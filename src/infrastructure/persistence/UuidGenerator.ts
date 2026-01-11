/**
 * UUID ID Generator - Infrastructure Layer
 *
 * Implementa generación de IDs usando UUID v4.
 */

import { randomUUID } from 'crypto';
import type { IIdGenerator } from '@application/interfaces';

export class UuidGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }

  isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
