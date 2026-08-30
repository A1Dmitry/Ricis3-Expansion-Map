import { describe, it, expect } from 'vitest';
import { RicisChatbotMonetizationService } from './ricisChatbotMonetization';
import { IChatbotProofTransaction } from './ricisChatbotMonetization.types';

describe('QA Suite: RICIS-III Chatbot Monetization', () => {
  it('QA-1: evaluates network value correctly using Axiom A6 for 0 * infinity', () => {
    const service = new RicisChatbotMonetizationService();

    const transaction: IChatbotProofTransaction = {
      transactionId: 'txn-12345',
      problemStatement: 'Proof of Concept for Monolithic Chatbot DB',
      computationCost: {
        originExpression: 'Cost per proof C -> 0',
        semanticIndex: '0_C',
        isSingularity: true,
        value: 10, // Представление геометрической ширины C в пространстве RICIS
      },
      scaleFactor: {
        originExpression: 'Number of proofs N -> infinity',
        semanticIndex: 'infinity_N',
        isSingularity: true,
        value: 50, // Представление геометрической высоты N в пространстве RICIS
      },
      history: [],
    };

    const result = service.evaluateNetworkValue(transaction);

    // Ожидаем O(1) редукцию 0_C * infinity_N = C * N (10 * 50 = 500)
    expect(result.value).toBe(500);
    expect(result.semanticIndex).toBe('C_times_N');
    expect(result.isSingularity).toBe(false);

    // Проверяем, что в лог трансформаций записалась аксиома A6
    expect(transaction.history.length).toBe(1);
    expect(transaction.history[0].axiomApplied).toBe('A6_GENERAL');
  });

  it('QA-2: preserves L1_IDENTITY meaning C * N matches the exact semantic type', () => {
    const service = new RicisChatbotMonetizationService();

    const transaction: IChatbotProofTransaction = {
      transactionId: 'txn-12346',
      problemStatement: 'Zero Cost infinite DB',
      computationCost: { originExpression: 'Cost', semanticIndex: '0_C', isSingularity: true, value: 0 },
      scaleFactor: { originExpression: 'Scale', semanticIndex: 'infinity_N', isSingularity: true, value: 1000 },
      history: [],
    };

    const result = service.evaluateNetworkValue(transaction);
    expect(result.value).toBe(0);
    expect(result.semanticIndex).toBe('C_times_N');
  });
});
