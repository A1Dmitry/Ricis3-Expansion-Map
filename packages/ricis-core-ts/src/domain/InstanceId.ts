/**
 * R-04 — `InstanceID` ≠ `Identity`.
 *
 *   Identity  → ЧТО это за структурный объект (каноническая форма).
 *   InstanceID → КОНКРЕТНЫЙ экземпляр.
 *
 * Поэтому два одинаковых выражения МОГУТ иметь:
 *   same Identity  ∧  different InstanceID
 *
 * Класс — иммутабельное value object; равенство только по значению строки.
 * DDD: отдельная сущность, строго не связанная с `Identity` (нет наследования/смешивания).
 */
export class InstanceId {
  private constructor(readonly value: string) {}

  /** Свежий уникальный идентификатор экземпляра. */
  static fresh(prefix = 'I'): InstanceId {
    InstanceId.seq += 1;
    return new InstanceId(`${prefix}${InstanceId.seq}`);
  }

  static of(value: string): InstanceId {
    return new InstanceId(value);
  }

  equals(other: InstanceId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static seq = 0;
}
