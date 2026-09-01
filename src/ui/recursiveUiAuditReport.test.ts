import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('RICIS-III Recursive UI Audit Report Verification', () => {
  it('verifies existence and structure of QA_RECURSIVE_AUDIT_REPORT.md', () => {
    const reportPath = path.join(process.cwd(), 'QA_RECURSIVE_AUDIT_REPORT.md');
    expect(fs.existsSync(reportPath)).toBe(true);
    
    const content = fs.readFileSync(reportPath, 'utf-8');
    expect(content).toContain('ОТЧЕТ ПО ПОЛНОМУ РЕКУРСИВНОМУ АУДИТУ ПОЛЬЗОВАТЕЛЬСКОГО ИНТЕРФЕЙСА');
    expect(content).toContain('1. МЕТОДОЛОГИЯ РЕКУРСИВНОГО ТЕСТИРОВАНИЯ UI');
    expect(content).toContain('2. РЕЗУЛЬТАТЫ ПРОВЕРКИ И ИНВЕНТАРИЗАЦИЯ ИНТЕРАКТИВНЫХ ЭЛЕМЕНТОВ');
    expect(content).toContain('3. ДЕТАЛИЗАЦИЯ ИДЕНТИФИЦИРОВАННЫХ ОСОБЕННОСТЕЙ И БАГОВ (BUG MATRIX)');
    expect(content).toContain('4. РЕКОМЕНДАЦИИ И СТАТУС ВЕРИФИКАЦИИ');
    expect(content).toContain('v0.4.107');
  });
});
