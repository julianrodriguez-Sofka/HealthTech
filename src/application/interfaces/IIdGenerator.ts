/**
 * ID Generator Interface - Application Layer
 *
 * Define el contrato para generación de identificadores únicos.
 *
 * HUMAN REVIEW: Abstracción para permitir diferentes estrategias
 * de generación de IDs (UUID, ULID, Snowflake, auto-increment, etc.)
 */

export interface IIdGenerator {
  /**
   * Genera un identificador único
   *
   * @returns ID único como string
   */
  generate(): string;

  /**
   * Valida si un string es un ID válido para esta estrategia
   *
   * @param id - ID a validar
   * @returns true si el ID es válido
   */
  isValid(id: string): boolean;
}
