// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const moduleDirectory = resolve(process.cwd(), 'src/ricisSeed');

/**
 * Проверки считаются только по коду: комментарии и документация удаляются.
 * Иначе тест ловил бы собственные формулировки («без Math.random», «без NaN»),
 * то есть проверял бы текст о запрете, а не исполняемую логику (типичная туфта).
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function sources(): Array<{ readonly file: string; readonly text: string }> {
  return readdirSync(moduleDirectory)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map(file => ({ file, text: stripComments(readFileSync(join(moduleDirectory, file), 'utf8')) }));
}

describe('RICIS SEED — топология модуля', () => {
  it('остаётся чистым доменом: без React, DOM, сети и внешних сервисов', () => {
    for (const { file, text } of sources()) {
      expect(text, file).not.toMatch(/from ['"](react|react-dom|three|@react-three\/fiber)/);
      expect(text, file).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|axios/);
      expect(text, file).not.toMatch(/from ['"]node:(fs|net|http|child_process)/);
      expect(text, file).not.toMatch(/from ['"]\.\.\/(ui|store|services|model)/);
    }
  });

  it('не использует недетерминированные источники: никаких Math.random, Date.now и криптографии', () => {
    for (const { file, text } of sources()) {
      expect(text, file).not.toMatch(/Math\s*\.\s*random\s*\(/);
      expect(text, file).not.toMatch(/Date\s*\.\s*now\s*\(|new\s+Date\s*\(/);
      expect(text, file).not.toMatch(/node:crypto|randomUUID/);
    }
  });

  it('не содержит запрещённых численных обходных путей: NaN, Infinity, eps-пороги, деление на ноль', () => {
    for (const { file, text } of sources()) {
      expect(text, file).not.toMatch(/\bNaN\b|\bInfinity\b/);
      expect(text, file).not.toMatch(/Math\s*\.\s*abs\s*\([^)]*\)\s*<\s*(eps|1e-)/);
      expect(text, file).not.toMatch(/Divide by zero/);
    }
  });

  it('не содержит заглушек и незавершённой реализации', () => {
    for (const { file, text } of sources()) {
      expect(text, file).not.toMatch(/TODO|FIXME/);
      expect(text, file).not.toMatch(/:\s*any\b|\bas\s+any\b/);
      expect(text, file).not.toMatch(/throw new Error\(['"]not implemented/i);
    }
  });

  it('не объявляет расширение «доказанным по Lean» без внешнего kernel evidence', () => {
    const domain = sources().find(entry => entry.file === 'ricisSeed.domain.ts')!;
    expect(domain.text).toContain('kernelEvidenceOk');
    expect(domain.text).toContain('sorryFree');
    // Ни один демонстрационный решатель не вправе заявлять проверку ядром Lean:
    // локальная структурная проверка не является запуском Lean kernel.
    for (const { file, text } of sources()) {
      expect(text, file).not.toContain("strategy: 'LEAN_KERNEL'");
    }
  });

  it('экспортирует каноническую запись протокола через публичную точку входа', () => {
    const index = readFileSync(join(moduleDirectory, 'index.ts'), 'utf8');
    expect(index).toContain('export const Ric = createRicisSystem(');
    expect(index).toContain('export const RicisSeedSystem = createRicisSystem(');
  });
});
