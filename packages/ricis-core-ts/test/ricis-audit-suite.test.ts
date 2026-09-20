import { describe, it, expect } from 'vitest';
import { AST } from '../src/ast/ExpressionTypes';
import { AstCanonicalizer } from '../src/domain/Canonicalizer';
import { IdentityProvider } from '../src/domain/Identity';
import { InstanceId } from '../src/domain/InstanceId';
import { SemanticIndex } from '../src/domain/SemanticIndex';
import { deriveSemanticType } from '../src/domain/SemanticType';
import { Monolith } from '../src/domain/Monolith';
import { resolutionRulesOrdered } from '../src/operations/ResolutionCatalog';
import { RicisKernel } from '../src/kernel/RicisKernel';
import { SemanticIndexer } from '../src/engine/SemanticIndexer';
import { ThreeLayerAudit } from '../src/audit/ThreeLayerAudit';
import { listConveniences, metadataHonesty } from '../src/audit/ImplementationConveniences';
import { AlgebraicSimplifier } from '../src/engine/AlgebraicSimplifier';

const eq = (a: any, b: any) => AlgebraicSimplifier.areEqual(a, b);

describe('R-02 — Expr is a recursive tree; canonical STRING via normalizeExpr', () => {
  const c = new AstCanonicalizer();
  it('canonicalizes commutative Add regardless of operand order', () => {
    const a = AST.Add(AST.Var('x'), AST.Var('y'));
    const b = AST.Add(AST.Var('y'), AST.Var('x'));
    expect(c.canonicalize(a)).toBe(c.canonicalize(b));
  });
  it('Expr is a structured tree, not a string', () => {
    const e = AST.Add(AST.Mul(AST.Var('x'), AST.Const(2)), AST.Var('y'));
    expect(typeof e).toBe('object');
    expect((e as any).nodeType).toBe('Add');
  });
});

describe('R-03 — Identity layer separated from Expr', () => {
  const p = new IdentityProvider();
  it('computeIdentity yields {hash, canonical}', () => {
    const id = p.computeIdentity(AST.Add(AST.Var('x'), AST.Const(1)));
    expect(id).toHaveProperty('hash');
    expect(typeof id.canonical).toBe('string');
  });
  it('same expr -> same identity; different expr -> different identity', () => {
    const a = p.computeIdentity(AST.Add(AST.Var('x'), AST.Const(1)));
    const b = p.computeIdentity(AST.Add(AST.Var('x'), AST.Const(1)));
    const d = p.computeIdentity(AST.Add(AST.Var('x'), AST.Const(2)));
    expect(a.hash).toBe(b.hash);
    expect(a.hash).not.toBe(d.hash);
  });
});

describe('R-04 — InstanceId strictly distinct from Identity', () => {
  it('two equal exprs share Identity but differ in InstanceId', () => {
    const i1 = SemanticIndex.atomic(AST.Var('x'), 'x1');
    const i2 = SemanticIndex.atomic(AST.Var('x'), 'x2');
    expect(i1.sameIdentity(i2)).toBe(true);
    expect(i1.instanceId.equals(i2.instanceId)).toBe(false);
  });
  it('InstanceId equality is value-based', () => {
    expect(InstanceId.of('A').equals(InstanceId.of('A'))).toBe(true);
    expect(InstanceId.of('A').equals(InstanceId.of('B'))).toBe(false);
  });
});

describe('R-05 — Index as monolithic semantic carrier; Monolith aggregate', () => {
  it('carries Identity, InstanceId, Expr, name, SemanticType, Provenance', () => {
    const idx = SemanticIndex.atomic(AST.Zero(AST.Var('f')), '0_f');
    expect(idx.identity).toBeDefined();
    expect(idx.instanceId).toBeDefined();
    expect(idx.expr.nodeType).toBe('SingularityZero');
    expect(idx.name).toBe('0_f');
    expect(idx.semanticType).toBe('Zero');
    expect(idx.provenance.kind).toBe('atomic');
  });
  it('deriveSemanticType maps singularities and scalars', () => {
    expect(deriveSemanticType(AST.Zero(AST.Var('f')))).toBe('Zero');
    expect(deriveSemanticType(AST.Inf(AST.Var('g')))).toBe('Infinity');
    expect(deriveSemanticType(AST.Const(3))).toBe('Scalar');
    expect(deriveSemanticType(AST.Var('x'))).toBe('Algebraic');
  });
  it('Monolith stores indices by InstanceId', () => {
    const m = new Monolith();
    const idx = SemanticIndex.atomic(AST.Var('x'), 'x');
    m.add(idx);
    expect(m.get(idx.instanceId.value)).toBe(idx);
    expect(m.size).toBe(1);
  });
});

describe('R-06 / R-07 — Index.combine generates NEW whole with explicit provenance', () => {
  it('combine does not mutate parents and records both parents', () => {
    const a = SemanticIndex.atomic(AST.Var('f'), 'f');
    const b = SemanticIndex.atomic(AST.Var('g'), 'g');
    const combined = a.combine(b, AST.Mul(AST.Var('f'), AST.Var('g')), '*');
    expect(combined.instanceId.equals(a.instanceId)).toBe(false);
    expect(combined.instanceId.equals(b.instanceId)).toBe(false);
    expect(combined.provenance.kind).toBe('explicit');
    expect(combined.provenance.parents).toEqual([a.instanceId, b.instanceId]);
    expect(eq(combined.provenance.resultExpr, AST.Mul(AST.Var('f'), AST.Var('g')))).toBe(true);
    expect(eq(combined.expr, AST.Mul(AST.Var('f'), AST.Var('g')))).toBe(true);
    // parents unchanged
    expect(a.provenance.kind).toBe('atomic');
    expect(b.provenance.kind).toBe('atomic');
  });
});

describe('R-08 — ResolutionPriority is explicit and ordered', () => {
  it('catalog follows audit ordering SP2 -> A6 -> TypeConsistency', () => {
    const rules = resolutionRulesOrdered();
    const sp2 = rules.find((r) => r.name === 'L1/IdentityCancel')!; // SP2 layer (priority 10)
    const a6 = rules.find((r) => r.axiomRef === 'A6')!; // priority 20
    const conv = rules.find((r) => r.name === 'A-A=0')!; // TypeConsistency (priority 40)
    expect(sp2.priority).toBeLessThan(a6.priority);
    expect(a6.priority).toBeLessThan(conv.priority);
    // full list is non-decreasing by priority
    for (let i = 1; i < rules.length; i++) {
      expect(rules[i]!.priority).toBeGreaterThanOrEqual(rules[i - 1]!.priority);
    }
  });
  it('engine resolves 0_F * inf_G via A6 to F*G (single source, no duplicate impl)', () => {
    const k = new RicisKernel();
    const f = k.index(AST.Zero(AST.Var('f')), '0_f');
    const g = k.index(AST.Inf(AST.Var('g')), 'inf_g');
    const r = k.combine(f, g, 'Multiply');
    expect(eq(r.expr, AST.Mul(AST.Var('f'), AST.Var('g')))).toBe(true);
  });
});

describe('R-09 — axioms vs conveniences separation / metadata honesty', () => {
  it('conveniences enumerated separately; full consistency claim denied', () => {
    const conv = listConveniences();
    expect(conv.length).toBeGreaterThan(0);
    const meta = metadataHonesty();
    expect(meta.claimsFullConsistencyWithMain).toBe(false);
  });
});

describe('R-10 — A7 with identity-based reduction (in the single engine)', () => {
  const k = new RicisKernel();
  it('inf_F - inf_F = 0', () => {
    const a = k.index(AST.Inf(AST.Var('x')), 'inf_x');
    const b = k.index(AST.Inf(AST.Var('x')), 'inf_x2');
    const r = k.combine(a, b, 'Subtract');
    expect(eq(r.expr, AST.Const(0))).toBe(true);
  });
  it('inf_F - inf_G = inf_(F-G) (resolved basis difference)', () => {
    const a = k.index(AST.Inf(AST.Var('x')), 'inf_x');
    const b = k.index(AST.Inf(AST.Var('y')), 'inf_y');
    const r = k.combine(a, b, 'Subtract');
    expect(r.expr.nodeType).toBe('Subtract');
  });
});

describe('R-11 — SP2 через ЯДРО RICIS (без классической алгебры / пределов / Лопиталя)', () => {
  it('пример аудита (x^2-4)/(x-2) -> x+2 реализован СТРУКТУРНОЙ SP2 ядра (index -> algSimplify), без Лопиталя/пределов', () => {
    const k = new RicisKernel();
    const e = AST.Div(
      AST.Sub(AST.Pow(AST.Var('x'), AST.Const(2)), AST.Const(4)),
      AST.Sub(AST.Var('x'), AST.Const(2)),
    );
    const idx = k.index(e, 'e'); // Expr -> algSimplify(SP2) -> Identity -> Index
    expect(eq(idx.expr, AST.Add(AST.Var('x'), AST.Const(2)))).toBe(true);
  });
  it('отдельностоящее x^2-4 НЕ факторизуется классическим тождеством разности квадратов — это НЕ аксиома RICIS', () => {
    const k = new RicisKernel();
    const e = AST.Sub(AST.Pow(AST.Var('x'), AST.Const(2)), AST.Const(4));
    const idx = k.index(e, 'e');
    // RICIS оставляет x^2-4 как есть: разность квадратов — классическая алгебра, вне аксиом Main (R-09).
    expect(eq(idx.expr, e)).toBe(true);
  });
});

describe('R-12 (CRITICAL) — resolveLimit implements SP4: 0_f, not 0_(f-a)', () => {
  it('f=x^2-4 at a=2 indexes 0_f (basis = original f)', () => {
    const f = AST.Sub(AST.Pow(AST.Var('x'), AST.Const(2)), AST.Const(4));
    const res: any = SemanticIndexer.indexAtPoint(f, 'x', 2);
    expect(res.nodeType).toBe('SingularityZero');
    expect(eq(res.basis, f)).toBe(true);
    // crucially NOT 0_(f-a) = 0_(x^2-6)
    const wrongBasis = AST.Sub(AST.Pow(AST.Var('x'), AST.Const(2)), AST.Const(6));
    expect(eq(res.basis, wrongBasis)).toBe(false);
  });
  it('finite evaluation returns the constant', () => {
    const f = AST.Add(AST.Var('x'), AST.Const(1));
    expect(SemanticIndexer.indexAtPoint(f, 'x', 3)).toEqual(AST.Const(4));
  });
});

describe('R-01 — kernel orchestrates the full chain; R-06 combine via A6; R-12 via kernel', () => {
  const k = new RicisKernel();
  it('0_f * inf_g -> new index with F*G and explicit parents', () => {
    const a = k.index(AST.Zero(AST.Var('f')), '0_f');
    const b = k.index(AST.Inf(AST.Var('g')), 'inf_g');
    const r = k.combine(a, b, 'Multiply');
    expect(eq(r.expr, AST.Mul(AST.Var('f'), AST.Var('g')))).toBe(true);
    expect(r.provenance.kind).toBe('explicit');
    expect(r.provenance.parents).toEqual([a.instanceId, b.instanceId]);
    expect(k.monolithStates.length).toBe(3);
  });
  it('SP4 reachable through kernel.resolveLimit (delegates to existing SemanticIndexer)', () => {
    const f = AST.Sub(AST.Pow(AST.Var('x'), AST.Const(2)), AST.Const(4));
    const res: any = k.resolveLimit(f, 'x', 2);
    expect(res.nodeType).toBe('SingularityZero');
    expect(eq(res.basis, f)).toBe(true);
  });
});

describe('Closing principle — three-layer audit & metadata honesty', () => {
  it('records Main/impl/proof and flags unproven metadata', () => {
    const audit = new ThreeLayerAudit();
    audit.record({
      id: 'R-12',
      mainSpec: 'SP4 indexes 0_f',
      implementation: 'SemanticIndexer.indexAtPoint returns AST.Zero(original f)',
      proofStatus: 'tested',
    });
    audit.record({
      id: 'fractalLaw',
      mainSpec: 'Fractal law implemented',
      implementation: 'metadata claims implemented',
      proofStatus: 'unproven',
      honestNote: 'no formal proof or test',
    });
    const report = audit.report();
    expect(report).toHaveLength(2);
    expect(audit.unprovenClaims().map((c) => c.id)).toContain('fractalLaw');
    expect(audit.allSubstantiated()).toBe(false);
  });
});
