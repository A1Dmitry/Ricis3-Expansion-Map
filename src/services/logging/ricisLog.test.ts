import { describe, it, expect, beforeEach } from 'vitest';
import type { ProofStep } from '../../model/types';
import {
  RicisLogAssertionError,
  type ILog,
  type ILogRecord,
  type IDocumentFormatter,
  type IProofDocumentMetadata,
} from './contracts/ricisLog.contracts';
import { RicisLogger } from './domain/ricisLogger';
import { SimpleTextDocumentFormatter } from './formatters/simpleTextDocumentFormatter';
import { JsonDocumentFormatter } from './formatters/jsonDocumentFormatter';
import { LatexProofDocumentFormatter } from './formatters/latexProofDocumentFormatter';
import { LeanProofDocumentFormatter } from './formatters/leanProofDocumentFormatter';

describe('RICIS-III ILog<T> & Document Formatters Architecture', () => {
  let logger: ILog<string, ProofStep>;

  beforeEach(() => {
    logger = new RicisLogger<string, ProofStep>('GradientStabilizer');
  });

  describe('1. Базовый контракт ILog<T> (Запись, Категория, Очистка)', () => {
    it('должен инициализировать категорию и пустой список записей', () => {
      expect(logger.category).toBe('GradientStabilizer');
      expect(logger.getEntries()).toHaveLength(0);
    });

    it('должен логировать сообщения уровней INFO, WARN и ERROR', () => {
      const step: ProofStep = {
        phase: -1,
        name: 'Phase -1: L1 Check',
        action: 'L1_IDENTITY',
        title: 'Phase -1: L1 Check',
        rule: 'L1_IDENTITY',
        expression: 'X = X',
        description: 'Type check passed',
      };

      const infoRecord = logger.info('Phase -1 started', step);
      expect(infoRecord.severity).toBe('INFO');
      expect(infoRecord.category).toBe('GradientStabilizer');
      expect(infoRecord.message).toBe('Phase -1 started');
      expect(infoRecord.data).toBe(step);

      const warnRecord = logger.warn('Loss spike potential detected');
      expect(warnRecord.severity).toBe('WARN');

      const errRecord = logger.error('NaN prevented by RICIS');
      expect(errRecord.severity).toBe('ERROR');

      expect(logger.getEntries()).toHaveLength(3);
    });

    it('должен очищать записи методом clear()', () => {
      logger.info('Message 1');
      logger.info('Message 2');
      expect(logger.getEntries()).toHaveLength(2);

      logger.clear();
      expect(logger.getEntries()).toHaveLength(0);
    });
  });

  describe('2. Принцип "throw лучше чем игнор, и пишем его в трэйс"', () => {
    it('assert(true) не должен ничего логировать и не должен выбрасывать исключение', () => {
      expect(() => {
        logger.assert(true, 'Everything is valid');
      }).not.toThrow();

      expect(logger.getEntries()).toHaveLength(0);
    });

    it('assert(false) обязан сначала зафиксировать ошибку в трэйс, а затем выбросить исключение', () => {
      const failedContext: ProofStep = {
        phase: 2,
        name: 'Phase 2: Axiom A6',
        action: 'A6_GENERAL_PRODUCT',
        title: 'Phase 2: Axiom A6',
        rule: 'A6_GENERAL_PRODUCT',
        expression: '0_eta * inf_grad',
        description: 'Testing assertion breach',
      };

      let caughtError: unknown = null;
      try {
        logger.assert(false, 'Gradient norm must not be NaN', failedContext);
      } catch (err) {
        caughtError = err;
      }

      // 1. Проверяем, что исключение гарантированно выброшено
      expect(caughtError).toBeInstanceOf(RicisLogAssertionError);
      const assertionErr = caughtError as RicisLogAssertionError;
      expect(assertionErr.message).toContain('Gradient norm must not be NaN');

      // 2. Проверяем, что в журнале трэйса ошибка УЖЕ записана до выброса
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      const fatalRecord = entries[0];
      expect(fatalRecord.severity).toBe('FATAL');
      expect(fatalRecord.message).toBe('Gradient norm must not be NaN');
      expect(fatalRecord.data).toEqual(failedContext);
    });

    it('throwAndLog обязан зафиксировать ошибку в трэйс и выбросить её', () => {
      const errorObj = new Error('Singularity bridge collapse');

      expect(() => {
        logger.throwAndLog(errorObj);
      }).toThrow('Singularity bridge collapse');

      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].severity).toBe('ERROR');
      expect(entries[0].error).toBe(errorObj);
    });
  });

  describe('3. Форматтеры документов (Разделение ответственности SRP)', () => {
    let mockSteps: ProofStep[];

    beforeEach(() => {
      mockSteps = [
        {
          phase: -1,
          name: 'Phase -1: L1 Identity & Type Consistency',
          action: 'L1_IDENTITY',
          title: 'Phase -1: L1 Identity & Type Consistency',
          rule: 'L1_IDENTITY',
          expression: 'eta: Real, grad: Real^N',
          description: 'Type boundaries verified',
        },
        {
          phase: 2,
          name: 'Phase 2: Axiom A6 Geometric Bridge',
          action: 'A6_GENERAL_PRODUCT',
          title: 'Phase 2: Axiom A6 Geometric Bridge',
          rule: 'A6_GENERAL_PRODUCT',
          expression: '0_{eta} \\times \\infty_{\\nabla L} = \\det(u, v) = \\eta \\cdot \\|\\nabla L\\|',
          description: 'Resolved into exact area invariant in O(1)',
        },
      ];

      for (const step of mockSteps) {
        logger.log(step, 'INFO', step.title ?? step.name);
      }
    });

    it('SimpleTextDocumentFormatter: должен форматировать лог в текстовый документ', () => {
      const formatter = new SimpleTextDocumentFormatter<ProofStep>();
      const document = formatter.format(logger.getEntries(), { title: 'Gradient Audit' });

      expect(document).toContain('=== Gradient Audit ===');
      expect(document).toContain('[INFO] [GradientStabilizer] Phase -1: L1 Identity & Type Consistency');
      expect(document).toContain('Phase 2: Axiom A6 Geometric Bridge');
    });

    it('JsonDocumentFormatter: должен сериализовать лог в валидный JSON со структурированными записями', () => {
      const formatter = new JsonDocumentFormatter<ProofStep>();
      const jsonStr = formatter.format(logger.getEntries(), { version: '0.4.145' });

      const parsed = JSON.parse(jsonStr);
      expect(parsed.category).toBe('GradientStabilizer');
      expect(parsed.totalEntries).toBe(2);
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[1].data.rule).toBe('A6_GENERAL_PRODUCT');
    });

    it('LatexProofDocumentFormatter: должен генерировать математический документ LaTeX с аксиомами', () => {
      const formatter = new LatexProofDocumentFormatter();
      const meta: IProofDocumentMetadata = {
        title: 'RICIS-III Proof: LLM Gradient Explosion Elimination',
        author: 'Dmitry V. Aleinikov',
        orcid: '0009-0004-3226-7700',
        doi: '10.5281/zenodo.21491712',
        targetFunction: '\\Delta w = 0_\\eta \\times \\infty_{\\nabla L} = \\eta \\cdot \\nabla L',
        initialExpression: '0_\\eta \\times \\infty_{\\nabla L}',
        finalInvariant: '\\eta \\cdot \\|\\nabla L\\|',
      };

      const latexDoc = formatter.format(logger.getEntries(), meta);

      expect(latexDoc).toContain('\\section*{RICIS-III Proof: LLM Gradient Explosion Elimination}');
      expect(latexDoc).toContain('\\textbf{Author:} Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)');
      expect(latexDoc).toContain('10.5281/zenodo.21491712');
      expect(latexDoc).toContain('A6\\_GENERAL\\_PRODUCT');
      expect(latexDoc).toContain('\\det(u, v)');
    });

    it('LeanProofDocumentFormatter: должен генерировать формальный код доказательства Lean 4', () => {
      const formatter = new LeanProofDocumentFormatter();
      const leanDoc = formatter.format(logger.getEntries(), {
        taskId: 'registry-118',
        taskTitle: 'LLM Gradient Explosion Elimination',
        theoremName: 'ricis_gradient_explosion_elimination',
      });

      expect(leanDoc).toContain('theorem');
      expect(leanDoc).toContain('ricis_gradient_explosion_elimination');
      expect(leanDoc).not.toContain('sorry');
    });
  });
});
