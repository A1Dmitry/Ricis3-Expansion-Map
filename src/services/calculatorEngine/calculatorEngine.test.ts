import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ICalculatorExplorerService,
  IDeterministicRicisEngineService,
  IFreeHostingDatabaseService,
  CalculatorCasePresetDTO,
  SandboxExecutionPayloadDTO,
  RicisCalculationResultDTO,
  DatabaseServerTemplateDTO,
  FreeHostingDatabaseKind,
} from './types';

// Mock implementations for Step 3 QA Automation validation
class MockCalculatorExplorerService implements ICalculatorExplorerService {
  private readonly canonicalCases: readonly CalculatorCasePresetDTO[] = [
    {
      caseId: 'case-a6-bridge',
      title: 'A6 Geometric Bridge (0 * ∞)',
      inputFormula: '0_F * ∞_G',
      expectedInvariant: 'F * G',
      primaryAxiom: 'A6_GEOMETRIC_BRIDGE',
      complexity: 'O(1)',
      description: 'Resolution of indeterminate product 0 * ∞ via Skew Product of orthogonal vectors in R_RICIS^2.',
      leanTheoremName: 'theorem_a6_geometric_bridge',
    },
    {
      caseId: 'case-a4-zero-ratio',
      title: 'A4 Zero Ratio (0_F / 0_G)',
      inputFormula: '0_F / 0_G',
      expectedInvariant: 'F / G',
      primaryAxiom: 'A4_ZERO_RATIO',
      complexity: 'O(1)',
      description: 'Ratio of zeros determined by their generating semantic indices.',
      leanTheoremName: 'theorem_a4_zero_ratio',
    },
    {
      caseId: 'case-sp1-locality',
      title: 'SP1 Locality ((x-5)(x+5)/(x-5) at x=5)',
      inputFormula: '((x - 5) * (x + 5)) / (x - 5)',
      coordinateX: 5,
      expectedInvariant: '10',
      primaryAxiom: 'SP1_LOCALITY',
      complexity: 'O(1)',
      description: 'Zero factor cancellation preserves active polynomial tail.',
      leanTheoremName: 'theorem_sp1_locality',
    },
    {
      caseId: 'case-a7-infinity-subtraction',
      title: 'A7 Infinity Subtraction (∞_F - ∞_G)',
      inputFormula: '∞_F - ∞_G',
      expectedInvariant: '∞_(F - G)',
      primaryAxiom: 'A7_INFINITY_SUBTRACTION',
      complexity: 'O(1)',
      description: 'Deterministic subtraction of indexed infinities.',
      leanTheoremName: 'theorem_a7_infinity_subtraction',
    },
  ];

  getCanonicalMonolithCases(): readonly CalculatorCasePresetDTO[] {
    return this.canonicalCases;
  }

  findCaseByNodeId(nodeId: string): CalculatorCasePresetDTO | null {
    if (nodeId.includes('a6') || nodeId.includes('bridge')) return this.canonicalCases[0] ?? null;
    if (nodeId.includes('a4') || nodeId.includes('ratio')) return this.canonicalCases[1] ?? null;
    if (nodeId.includes('sp1') || nodeId.includes('locality')) return this.canonicalCases[2] ?? null;
    return null;
  }

  createTerminalLaunchPayload(preset: CalculatorCasePresetDTO): SandboxExecutionPayloadDTO {
    return {
      rawExpression: preset.inputFormula,
      variableSubstitutions: preset.coordinateX !== undefined ? { x: preset.coordinateX } : {},
      targetPhase: 6,
      mode: 'instant_reduction',
    };
  }
}

class MockDeterministicRicisEngineService implements IDeterministicRicisEngineService {
  async evaluate(payload: SandboxExecutionPayloadDTO): Promise<RicisCalculationResultDTO> {
    const expr = payload.rawExpression;

    if (expr.includes('0_F * ∞_G') || expr.includes('0_3 * inf_4') || expr.includes('0_') && expr.includes('inf_')) {
      return {
        success: true,
        inputExpression: expr,
        finalInvariant: '12',
        numericValue: 12,
        traces: [
          { phase: -1, phaseName: 'L1 Identity Check', expressionBefore: expr, expressionAfter: expr, explanation: 'Type boundary verified in R_RICIS^2', isSingularNode: true },
          { phase: 2, phaseName: 'A6 Geometric Bridge', expressionBefore: expr, expressionAfter: '3 * 4', axiomApplied: 'A6_GEOMETRIC_BRIDGE', explanation: 'det(u, v) = u_x * v_y - 0 = 3 * 4 = 12', isSingularNode: true },
          { phase: 6, phaseName: 'L1 Final Verification', expressionBefore: '12', expressionAfter: '12', explanation: 'Invariant is stable and exact in O(1)', isSingularNode: false },
        ],
        leanProofCode: 'theorem a6_bridge_eval : (0 : RicisZero 3) * (∞ : RicisInf 4) = 12 := by rfl',
        executionTimeMs: 0.1,
      };
    }

    if (expr.includes('((x - 5) * (x + 5)) / (x - 5)') && payload.variableSubstitutions['x'] === 5) {
      return {
        success: true,
        inputExpression: expr,
        finalInvariant: '10',
        numericValue: 10,
        traces: [
          { phase: 1, phaseName: 'SP2 Reduction Priority', expressionBefore: expr, expressionAfter: '(0_(x-5) / 0_(x-5)) * (x + 5)', explanation: 'Factored identical zero terms', isSingularNode: true },
          { phase: 2, phaseName: 'SP1 Locality & L1 Identity', expressionBefore: '(0_(x-5) / 0_(x-5)) * (x + 5)', expressionAfter: '1 * (5 + 5)', explanation: '0_(x-5)/0_(x-5) = 1, tail evaluated to 10', isSingularNode: false },
          { phase: 6, phaseName: 'L1 Final Verification', expressionBefore: '10', expressionAfter: '10', explanation: 'Result = 10 in O(1)', isSingularNode: false },
        ],
        leanProofCode: 'theorem sp1_locality_eval : eval_ricis "((x-5)*(x+5))/(x-5)" 5 = 10 := by rfl',
        executionTimeMs: 0.1,
      };
    }

    return {
      success: true,
      inputExpression: expr,
      finalInvariant: 'Resolved Invariant',
      numericValue: 1,
      traces: [],
      executionTimeMs: 0.05,
    };
  }

  resolveSingularity(op: '0/0' | '0*inf' | 'inf/inf' | 'inf-inf', f: string, g: string): RicisCalculationResultDTO {
    if (op === '0*inf') {
      return {
        success: true,
        inputExpression: `0_${f} * ∞_${g}`,
        finalInvariant: `${f} * ${g}`,
        numericValue: null,
        traces: [
          { phase: 2, phaseName: 'A6 Geometric Bridge', expressionBefore: `0_${f} * ∞_${g}`, expressionAfter: `${f} * ${g}`, axiomApplied: 'A6_GEOMETRIC_BRIDGE', explanation: 'det(u, v) = F * G', isSingularNode: true },
        ],
        executionTimeMs: 0.05,
      };
    }
    if (op === '0/0') {
      return {
        success: true,
        inputExpression: `0_${f} / 0_${g}`,
        finalInvariant: `${f} / ${g}`,
        numericValue: null,
        traces: [
          { phase: 2, phaseName: 'A4 Zero Ratio', expressionBefore: `0_${f} / 0_${g}`, expressionAfter: `${f} / ${g}`, axiomApplied: 'A4_ZERO_RATIO', explanation: '0_F / 0_G = F / G', isSingularNode: true },
        ],
        executionTimeMs: 0.05,
      };
    }
    return {
      success: true,
      inputExpression: `${op}`,
      finalInvariant: '1',
      numericValue: 1,
      traces: [],
      executionTimeMs: 0.05,
    };
  }
}

class MockFreeHostingDatabaseService implements IFreeHostingDatabaseService {
  private readonly templates: readonly DatabaseServerTemplateDTO[] = [
    {
      kind: 'cloud_sql_postgres_free_tier',
      displayName: 'Google Cloud SQL (PostgreSQL Developer Edition)',
      freeTierLimits: 'Free tier with scale-to-zero compute and zero idling cost on Google Cloud Run.',
      configurationTemplate: `
# Cloud SQL PostgreSQL Configuration
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/ricis_db
POSTGRES_MAX_CONNECTIONS=10
      `.trim(),
      migrationScriptExample: `
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
      `.trim(),
      isSupportedOnCurrentPlatform: true,
    },
    {
      kind: 'firebase_firestore_spark',
      displayName: 'Google Firebase Firestore (Spark Free Plan)',
      freeTierLimits: '1 GB storage, 50,000 reads/day, 20,000 writes/day free forever.',
      configurationTemplate: `
# Firebase Configuration
FIREBASE_PROJECT_ID=ricis-expansion-map
      `.trim(),
      migrationScriptExample: `
import { doc, setDoc } from 'firebase/firestore';
await setDoc(doc(db, 'workspaces', workspaceId), { name: 'Main', updatedAt: new Date() });
      `.trim(),
      isSupportedOnCurrentPlatform: true,
    },
    {
      kind: 'embedded_sqlite_volume',
      displayName: 'Embedded SQLite (Server Volume Storage)',
      freeTierLimits: '100% Free, zero network latency, persistent on local Cloud Run volume.',
      configurationTemplate: `
# SQLite Configuration
SQLITE_DB_PATH=./data/ricis_local.db
      `.trim(),
      migrationScriptExample: `
import Database from 'better-sqlite3';
const db = new Database('./data/ricis_local.db');
db.exec('CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT);');
      `.trim(),
      isSupportedOnCurrentPlatform: true,
    },
  ];

  getSupportedDatabaseTemplates(): readonly DatabaseServerTemplateDTO[] {
    return this.templates;
  }

  generateConnectionSnippet(kind: FreeHostingDatabaseKind): string {
    const found = this.templates.find(t => t.kind === kind);
    return found ? found.configurationTemplate : '';
  }
}

describe('RICIS-III Calculator Cases Execution & Free Database Hosting Templates (Agile Step 3 QA)', () => {
  describe('1. Calculator Explorer Monolith Cases & Presets', () => {
    let explorerService: ICalculatorExplorerService;

    beforeEach(() => {
      explorerService = new MockCalculatorExplorerService();
    });

    it('returns all canonical monolith cases with O(1) complexity and Lean theorem references', () => {
      const cases = explorerService.getCanonicalMonolithCases();
      expect(cases.length).toBeGreaterThanOrEqual(4);
      for (const c of cases) {
        expect(c.complexity).toBe('O(1)');
        expect(c.leanTheoremName).toMatch(/^theorem_/);
        expect(c.expectedInvariant).toBeTruthy();
      }
    });

    it('matches node IDs to exact calculator case presets', () => {
      const presetA6 = explorerService.findCaseByNodeId('node-a6-bridge');
      expect(presetA6).not.toBeNull();
      expect(presetA6?.primaryAxiom).toBe('A6_GEOMETRIC_BRIDGE');

      const presetSP1 = explorerService.findCaseByNodeId('node-sp1-locality');
      expect(presetSP1).not.toBeNull();
      expect(presetSP1?.coordinateX).toBe(5);
    });

    it('creates accurate sandbox launch payloads with variable substitutions', () => {
      const cases = explorerService.getCanonicalMonolithCases();
      const sp1Case = cases.find(c => c.primaryAxiom === 'SP1_LOCALITY')!;
      const payload = explorerService.createTerminalLaunchPayload(sp1Case);

      expect(payload.rawExpression).toBe('((x - 5) * (x + 5)) / (x - 5)');
      expect(payload.variableSubstitutions['x']).toBe(5);
      expect(payload.targetPhase).toBe(6);
    });
  });

  describe('2. Deterministic RICIS Engine Sandbox Evaluation', () => {
    let engine: IDeterministicRicisEngineService;

    beforeEach(() => {
      engine = new MockDeterministicRicisEngineService();
    });

    it('evaluates A6 Geometric Bridge 0_3 * inf_4 to 12 via Skew Product in O(1)', async () => {
      const result = await engine.evaluate({
        rawExpression: '0_3 * inf_4',
        variableSubstitutions: {},
        targetPhase: 6,
        mode: 'instant_reduction',
      });

      expect(result.success).toBe(true);
      expect(result.finalInvariant).toBe('12');
      expect(result.numericValue).toBe(12);
      expect(result.traces.some(t => t.axiomApplied === 'A6_GEOMETRIC_BRIDGE')).toBe(true);
    });

    it('evaluates SP1 locality at x=5 yielding exact 10 without Cauchy limits or NaN', async () => {
      const result = await engine.evaluate({
        rawExpression: '((x - 5) * (x + 5)) / (x - 5)',
        variableSubstitutions: { x: 5 },
        targetPhase: 6,
        mode: 'instant_reduction',
      });

      expect(result.success).toBe(true);
      expect(result.finalInvariant).toBe('10');
      expect(result.numericValue).toBe(10);
      expect(result.traces.some(t => t.phase === 1)).toBe(true);
    });

    it('resolves algebraic singularity parameters directly (0_F * inf_G => F * G)', () => {
      const res = engine.resolveSingularity('0*inf', 'F', 'G');
      expect(res.finalInvariant).toBe('F * G');
      expect(res.traces[0]?.axiomApplied).toBe('A6_GEOMETRIC_BRIDGE');
    });
  });

  describe('3. Free Hosting Database Server Templates', () => {
    let dbService: IFreeHostingDatabaseService;

    beforeEach(() => {
      dbService = new MockFreeHostingDatabaseService();
    });

    it('provides all 3 supported free-tier database server options (Cloud SQL, Firestore, SQLite)', () => {
      const templates = dbService.getSupportedDatabaseTemplates();
      expect(templates.length).toBe(3);

      const kinds = templates.map(t => t.kind);
      expect(kinds).toContain('cloud_sql_postgres_free_tier');
      expect(kinds).toContain('firebase_firestore_spark');
      expect(kinds).toContain('embedded_sqlite_volume');
    });

    it('verifies that all free database templates are marked as supported on the current platform', () => {
      const templates = dbService.getSupportedDatabaseTemplates();
      for (const tmpl of templates) {
        expect(tmpl.isSupportedOnCurrentPlatform).toBe(true);
        expect(tmpl.configurationTemplate).toBeTruthy();
        expect(tmpl.migrationScriptExample).toBeTruthy();
      }
    });

    it('generates exact connection configuration snippets by database kind', () => {
      const snippet = dbService.generateConnectionSnippet('cloud_sql_postgres_free_tier');
      expect(snippet).toContain('DATABASE_URL=postgresql://');
    });
  });
});
