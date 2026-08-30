import { describe, it, expect } from 'vitest';
import { LambdaParser } from '../src/parser/LambdaParser';
import { SemanticIndexer } from '../src/engine/SemanticIndexer';

describe('SemanticIndexer (Phase 0.5 - SP4)', () => {
  it('should structurally index 0_F / 0_G', () => {
    // (x^2 - 25) / (x - 5) at x=5
    const parsed = LambdaParser.parse("x => (x^2 - 25) / (x - 5)");
    const indexed = SemanticIndexer.indexAtPoint(parsed.body, parsed.parameterName, 5);

    // Should return Divide(SingularityZero, SingularityZero)
    expect(indexed.nodeType).toBe('Divide');
    expect((indexed as any).left.nodeType).toBe('SingularityZero');
    expect((indexed as any).right.nodeType).toBe('SingularityZero');
  });

  it('should structurally index sin(x) / x at x=0', () => {
    const parsed = LambdaParser.parse("x => sin(x) / x");
    const indexed = SemanticIndexer.indexAtPoint(parsed.body, parsed.parameterName, 0);

    expect(indexed.nodeType).toBe('Divide');
    expect((indexed as any).left.nodeType).toBe('SingularityZero');
    expect((indexed as any).right.nodeType).toBe('SingularityZero');
  });
});
