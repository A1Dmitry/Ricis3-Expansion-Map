import { describe, expect, it } from 'vitest';
import {
  createRicisSystem,
  createSeed,
  grow,
  type RicisSystem,
} from './ricisSeed.domain';
import {
  serializeSeedStateToJson,
  deserializeSeedStateFromJson,
  PersistentSeedStorage,
} from './knowledgeGraph';
import { UNSOLVED_PROBLEM_REGISTRY, DEMO_RESOLVERS } from './ricisSeed.unsolvedRegistry';

const U_NESTED = UNSOLVED_PROBLEM_REGISTRY[0]!;
const U_MIXED = UNSOLVED_PROBLEM_REGISTRY[1]!;

describe('RICIS SEED — Persistent Knowledge Graph & Restart Recovery', () => {
  it('сериализует и восстанавливает состояние R0 с сохранением отпечатка и защищённого ядра', () => {
    const r0 = createSeed();
    const json = serializeSeedStateToJson(r0);

    const recovered = deserializeSeedStateFromJson(json);
    expect(recovered.generation).toBe(r0.generation);
    expect(recovered.fingerprint).toBe(r0.fingerprint);
    expect(recovered.axioms.length).toBe(r0.axioms.length);
    expect(recovered.ledger.length).toBe(0);

    // Все аксиомы защищённого ядра присутствуют с теми же отпечатками
    for (const axiom of r0.axioms) {
      const recAxiom = recovered.axioms.find(a => a.id === axiom.id);
      expect(recAxiom).toBeDefined();
      expect(recAxiom?.fingerprint).toBe(axiom.fingerprint);
    }
  });

  it('RUN 1 -> terminate RAM -> RUN 2: переживает перезапуск процесса без передоказывания', () => {
    // RUN 1: Создаём систему, производим ExpandTo для U_NESTED -> R1
    const ric1 = createRicisSystem({ resolvers: DEMO_RESOLVERS });
    const { system: systemAfterRun1 } = grow(ric1, [U_NESTED]);

    expect(systemAfterRun1.seed.generation).toBe(1);
    const r1Fingerprint = systemAfterRun1.seed.fingerprint;
    const r1AxiomIds = systemAfterRun1.seed.axioms.map(a => a.id);
    expect(r1AxiomIds).toContain('A12');

    // Сохраняем в долговременное хранилище (симуляция записи на диск / LocalStorage / Persistent DB)
    const storage = new PersistentSeedStorage();
    storage.commitSnapshot(systemAfterRun1.seed);

    // PROCESS TERMINATES: уничтожаем все переменные RUN 1
    // RUN 2: Восстанавливаем систему с диска
    const loadedSeed = storage.loadSnapshot();
    expect(loadedSeed).not.toBeNull();
    if (!loadedSeed) return;

    expect(loadedSeed.generation).toBe(1);
    expect(loadedSeed.fingerprint).toBe(r1Fingerprint);
    expect(loadedSeed.ledger.length).toBe(1);
    expect(loadedSeed.ledger[0]?.axiomId).toBe('A12');

    // Запускаем систему поверх восстановленного зерна
    const ric2 = createRicisSystem({ seed: loadedSeed, resolvers: DEMO_RESOLVERS });
    expect(ric2.seed.generation).toBe(1);
    expect(ric2.seed.fingerprint).toBe(r1Fingerprint);

    // В RUN 2 форма U_NESTED уже покрыта и НЕ требует повторного доказательства или расширения
    const state2 = ric2.seed;
    expect(state2.axioms.some(a => a.id === 'A12')).toBe(true);

    // Выполняем шаг для следующей проблемы U_MIXED -> R2
    const { system: systemAfterRun2 } = grow(ric2, [U_MIXED]);
    expect(systemAfterRun2.seed.generation).toBe(2);
    expect(systemAfterRun2.seed.axioms.map(a => a.id)).toContain('A12');
    expect(systemAfterRun2.seed.axioms.map(a => a.id)).toContain('A13');
    expect(systemAfterRun2.seed.ledger.length).toBe(2);

    // Монотонность сохранена: R0 ⊂ R1 ⊂ R2
    expect(systemAfterRun2.seed.ledger[0]?.axiomId).toBe('A12');
    expect(systemAfterRun2.seed.ledger[1]?.axiomId).toBe('A13');
  });

  it('откатывает персистентное состояние при сбое коммита (Atomic Persistent Commit)', () => {
    const storage = new PersistentSeedStorage();
    const initialSeed = createSeed();
    storage.commitSnapshot(initialSeed);

    // Симулируем попытку записать невалидное/повреждённое состояние
    const corrupted = {
      ...initialSeed,
      generation: 999, // drift поколения и журнала
    };

    const commitResult = storage.tryCommitAtomic(corrupted);
    expect(commitResult.ok).toBe(false);

    // Хранилище осталось в исходном валидном состоянии R0
    const snapshot = storage.loadSnapshot();
    expect(snapshot?.generation).toBe(0);
    expect(snapshot?.fingerprint).toBe(initialSeed.fingerprint);
  });
});
