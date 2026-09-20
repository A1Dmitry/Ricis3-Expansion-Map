import { ISemanticIndex } from './SemanticIndex';

/**
 * R-05 — `Monolith` как множество состояний (агрегат индексов).
 *
 * DDD: Aggregate root, владеющий `SemanticIndex`-ами и поддерживающий
 * рекурсивную комбинацию. Хранит индексы по `InstanceId` (O(1) доступ).
 * Зависит от интерфейса `ISemanticIndex` (DIP).
 */
export class Monolith {
  private readonly states = new Map<string, ISemanticIndex>();

  add(index: ISemanticIndex): void {
    this.states.set(index.instanceId.value, index);
  }

  get(instanceIdValue: string): ISemanticIndex | undefined {
    return this.states.get(instanceIdValue);
  }

  all(): readonly ISemanticIndex[] {
    return [...this.states.values()];
  }

  get size(): number {
    return this.states.size;
  }
}
