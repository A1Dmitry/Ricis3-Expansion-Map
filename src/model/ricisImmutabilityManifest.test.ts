import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RICIS-III Immutability Manifest (Core Invariance)', () => {
  const manifestPath = join(process.cwd(), 'docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md');

  it('verifies that the canonical Immutability Manifest file exists', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('verifies the fundamental immutable principles in the manifest', () => {
    const content = readFileSync(manifestPath, 'utf8');

    // Principle 1
    expect(content).toContain('1. Аксиома, однажды созданная и принятая, не изменяется');
    expect(content).toContain('Принятая аксиома RICIS-III является частью идентичности системы');

    // Principle 2
    expect(content).toContain('2. Сомнение не является основанием для изменения Core');
    expect(content).toContain('Ошибка интерпретации не означает ошибку аксиомы');

    // Principle 3
    expect(content).toContain('3. Неизвестное — это допустимое состояние');
    expect(content).toContain('Честное «не доказано» выше, чем ложное «согласовано»');

    // Principle 4
    expect(content).toContain('4. AI не является владельцем семантики RICIS-III');
    expect(content).toContain('не обладают правом реформировать аксиоматику');

    // Principle 5
    expect(content).toContain('5. Эволюция происходит только через версионирование');
    expect(content).toContain('Развитие теории возможно исключительно путём');

    // Principle 6
    expect(content).toContain('6. Защита от деградации в классический анализ');
    expect(content).toContain('вернуть предельные переходы в ядро');
    expect(content).toContain('объявить сингулярность неопределённостью (`NaN`)');

    // Principle 7
    expect(content).toContain('7. Принцип нерушимости ядра (Core Invariance)');
    expect(content).toContain('Ядро либо принимается целиком, либо не принимается вовсе');

    // Principle 8 (2026-09-19, требование владельца): базис доказан извне и не перепроверяется.
    expect(content).toContain('8. Базис не перепроверяется: доказанное извне — данность');
    expect(content).toContain('Повторное доказательство');
    expect(content).toContain('DRY');
    expect(content).toContain('бритва Оккама');
    expect(content).toContain('Данность относится только к базису');
  });

  /**
   * Экономия ресурса исполнителя: правило «базис — данность» обязано жить в каноническом
   * документе агентов (AGENTS.md §14), быть связанным с §11/§12 и указывать на РЕАЛЬНУЮ
   * запись прогона, а не на обещание. Иначе LLM-исполнитель снова потратит ресурс на
   * повторное доказывание RICIS III (DRY/бритва Оккама).
   */
  it('keeps the concept-basis rule (AGENTS.md §14) recorded, cross-linked and pointing at a real run record', () => {
    const agentsContent = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf8');
    expect(agentsContent).toContain('14. БАЗИС RICIS-III — ДАННОСТЬ: НЕ ПЕРЕДОКАЗЫВАТЬ (DRY, БРИТВА ОККАМА)');
    expect(agentsContent).toContain('доказан извне и повторного');
    expect(agentsContent).toContain('отклоняется как избыточная');
    expect(agentsContent).toContain('**DRY (не повторяйся).**');
    expect(agentsContent).toContain('**Бритва Оккама.**');
    // Граница правила: данность не отменяет §12/§13 для новых утверждений.
    expect(agentsContent).toContain('Новое утверждение (новая теорема, новая версия артефакта, новая формулировка узла)');
    expect(agentsContent).toContain('§12. Ссылка на §14 не является');
    // Обратные ссылки: §11 и §12 не читаются как «передоказывай всё».
    expect(agentsContent).toContain('Базис не требует повторного доказательства');
    expect(agentsContent).toContain('повторного прогона не требует: см. §14');

    // Правило ссылается на запись, которая действительно существует.
    const registryPath = join(process.cwd(), 'artifacts/proofs/core-checks/kernel-findings.json');
    expect(existsSync(registryPath)).toBe(true);
    const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      artifacts: readonly { artifactId: string; outcome: string }[];
    };
    expect(registry.artifacts.some((artifact) => artifact.outcome === 'LEAN_VERIFIED')).toBe(true);
  });

  it('verifies manifest registration in the Documentation Catalog and Agents governance', () => {
    const catalogPath = join(process.cwd(), 'docs/00-governance/DOCUMENTATION_CATALOG.md');
    const catalogContent = readFileSync(catalogPath, 'utf8');
    expect(catalogContent).toContain('RICIS Immutability Manifest');

    const agentsPath = join(process.cwd(), 'AGENTS.md');
    const agentsContent = readFileSync(agentsPath, 'utf8');
    expect(agentsContent).toContain('11. МАНИФЕСТ НЕИЗМЕННОСТИ RICIS-III (CORE INVARIANCE)');
    expect(agentsContent).toContain('docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md');

    const readmePath = join(process.cwd(), 'README.md');
    const readmeContent = readFileSync(readmePath, 'utf8');
    expect(readmeContent).toContain('docs/00-governance/RICIS_IMMUTABILITY_MANIFEST.md');
  });
});
